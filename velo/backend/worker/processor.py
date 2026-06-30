import asyncio
import logging
from datetime import date, timedelta
from app.config import settings
from app.database import supabase_client
from app.connectors.chatgpt import ChatGPTConnector
from app.connectors.gemini import GeminiConnector
from app.connectors.base import build_consumer_prompt
from app.analysis.analyzer import analyze_response
from app.analysis.scorer import calculate_geo_score
from app.analysis.reporter import generate_report, generate_action_plan

logger = logging.getLogger(__name__)
QUERIES_PER_KEYWORD = 5
ENGINES = ["chatgpt", "gemini"]


async def process_job(job_id: str) -> None:
    db = supabase_client()
    job = db.table("jobs").select("*").eq("id", job_id).single().execute().data
    brand = db.table("brands").select("*").eq("id", job["brand_id"]).single().execute().data
    keywords = db.table("keywords").select("*").eq("brand_id", brand["id"]).execute().data

    db.table("jobs").update({"status": "running", "started_at": "now()"}).eq("id", job_id).execute()

    connectors = {
        "chatgpt": ChatGPTConnector(api_key=settings.openai_api_key),
        "gemini": GeminiConnector(api_key=settings.gemini_api_key),
    }

    scores_by_engine: dict[str, list[float]] = {"chatgpt": [], "gemini": []}
    keyword_scores: list[dict] = []
    sample_responses: list[str] = []

    for keyword in keywords:
        prompt = build_consumer_prompt(brand["name"], keyword["term"])

        for engine in ENGINES:
            analyses = []
            for _ in range(QUERIES_PER_KEYWORD):
                response_text = await connectors[engine].query(prompt)
                db.table("query_results").insert({
                    "job_id": job_id,
                    "keyword_id": keyword["id"],
                    "engine": engine,
                    "prompt_used": prompt,
                    "raw_response": response_text,
                }).execute()

                analysis = await analyze_response(
                    brand_name=brand["name"],
                    query=keyword["term"],
                    response=response_text,
                    api_key=settings.anthropic_api_key,
                )
                analyses.append(analysis)

                if analysis["mentioned"] and not sample_responses:
                    sample_responses.append(response_text[:500])

            score = calculate_geo_score(analyses)
            db.table("scores").upsert({
                "keyword_id": keyword["id"],
                "engine": engine,
                "date": str(date.today()),
                **score,
            }).execute()

            scores_by_engine[engine].append(score["geo_score"])
            keyword_scores.append({"term": keyword["term"], "geo_score": score["geo_score"]})

            action = await generate_action_plan(
                brand_name=brand["name"],
                keyword=keyword["term"],
                engine=engine,
                geo_score=score["geo_score"],
                sample_response=sample_responses[0] if sample_responses else "Marca não mencionada nas respostas.",
                api_key=settings.anthropic_api_key,
            )
            db.table("action_plans").upsert({
                "keyword_id": keyword["id"],
                "engine": engine,
                "recommendation": action["recommendation"],
                "priority": action["priority"],
            }, on_conflict="keyword_id,engine").execute()

    avg_scores = {
        engine: round(sum(scores) / len(scores), 2) if scores else 0
        for engine, scores in scores_by_engine.items()
    }

    report_md = await generate_report(
        brand_name=brand["name"],
        scores_by_engine=avg_scores,
        keyword_scores=keyword_scores,
        sample_response=sample_responses[0] if sample_responses else "Marca não foi mencionada esta semana.",
        api_key=settings.anthropic_api_key,
    )

    _today = date.today()
    _period_start = _today - timedelta(days=_today.weekday())
    _period_end = _period_start + timedelta(days=6)

    db.table("reports").insert({
        "brand_id": brand["id"],
        "period_start": str(_period_start),
        "period_end": str(_period_end),
        "content_md": report_md,
    }).execute()

    # Send weekly report email (non-blocking: errors logged, job not failed)
    if settings.resend_api_key:
        try:
            from app.email.sender import send_weekly_report_email
            users_result = db.table("user_organizations").select("user_id").eq(
                "organization_id", brand["organization_id"]
            ).execute()
            if users_result.data:
                user_id = users_result.data[0]["user_id"]
                user_resp = db.auth.admin.get_user_by_id(user_id)
                to_email = user_resp.user.email
                if to_email:
                    overall_score = round(
                        sum(avg_scores.values()) / max(len(avg_scores), 1)
                    )
                    top_action_text = (
                        keyword_scores[0]["term"] if keyword_scores
                        else "Acompanhe seu dashboard para as recomendações."
                    )
                    send_weekly_report_email(
                        api_key=settings.resend_api_key,
                        to_email=to_email,
                        brand_name=brand["name"],
                        geo_score=overall_score,
                        score_change=0,
                        report_url="https://app.velo.com.br/report",
                        top_action=top_action_text,
                    )
        except Exception as email_err:
            logger.warning("Erro ao enviar email de relatório: %s", email_err)

    db.table("jobs").update({
        "status": "done",
        "completed_at": "now()",
    }).eq("id", job_id).execute()

    logger.info("Job %s concluído com sucesso.", job_id)
