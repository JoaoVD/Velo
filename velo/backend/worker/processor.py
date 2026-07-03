import asyncio
import logging
from datetime import datetime, timedelta, timezone
from app.config import settings
from app.database import supabase_client
from app.connectors.chatgpt import ChatGPTConnector
from app.connectors.gemini import GeminiConnector
from app.connectors.base import build_consumer_prompt
from app.analysis.analyzer import analyze_response
from app.analysis.scorer import calculate_geo_score, calculate_competitor_scores
from app.analysis.alerts import compute_scan_delta
from app.analysis.reporter import generate_report, generate_action_plan

logger = logging.getLogger(__name__)
QUERIES_PER_KEYWORD = 5
ENGINES = ["chatgpt", "gemini"]


async def process_job(job_id: str) -> None:
    db = supabase_client()
    job = db.table("jobs").select("*").eq("id", job_id).single().execute().data
    if not job:
        raise ValueError(f"Job {job_id} não encontrado")
    brand = db.table("brands").select("*").eq("id", job["brand_id"]).single().execute().data
    if not brand:
        raise ValueError(f"Brand {job['brand_id']} não encontrada para o job {job_id}")
    keywords = db.table("keywords").select("*").eq("brand_id", brand["id"]).execute().data or []
    competitors = db.table("competitors").select("*").eq("brand_id", brand["id"]).execute().data or []
    competitor_names = [c["name"] for c in competitors]
    competitor_ids = {c["name"]: c["id"] for c in competitors}

    db.table("jobs").update({"status": "running", "started_at": "now()"}).eq("id", job_id).execute()

    connectors = {
        "chatgpt": ChatGPTConnector(api_key=settings.openai_api_key),
        "gemini": GeminiConnector(api_key=settings.gemini_api_key),
    }

    scores_by_engine: dict[str, list[float]] = {"chatgpt": [], "gemini": []}
    keyword_scores: list[dict] = []
    current_score_rows: list[dict] = []
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
                    competitors=competitor_names or None,
                )
                analyses.append(analysis)

                if analysis["mentioned"] and not sample_responses:
                    sample_responses.append(response_text[:500])

            score = calculate_geo_score(analyses)
            db.table("scores").upsert({
                "keyword_id": keyword["id"],
                "engine": engine,
                "date": str(datetime.now(timezone.utc).date()),
                **score,
            }).execute()

            scores_by_engine[engine].append(score["geo_score"])
            keyword_scores.append({"term": keyword["term"], "geo_score": score["geo_score"]})
            current_score_rows.append({
                "keyword_id": keyword["id"],
                "engine": engine,
                "geo_score": score["geo_score"],
                "mention_score": score["mention_score"],
            })

            if competitor_names:
                comp_scores = calculate_competitor_scores(analyses, competitor_names)
                for comp_name, cs in comp_scores.items():
                    db.table("competitor_scores").upsert({
                        "competitor_id": competitor_ids[comp_name],
                        "keyword_id": keyword["id"],
                        "engine": engine,
                        "date": str(datetime.now(timezone.utc).date()),
                        **cs,
                    }, on_conflict="competitor_id,keyword_id,engine,date").execute()

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

    # Compara com o scan anterior para digest (variação real) e alertas
    scan_delta = {"score_change": 0, "lost_mentions": [], "should_alert": False}
    keyword_ids = [k["id"] for k in keywords]
    if keyword_ids:
        previous_rows = db.table("scores").select(
            "keyword_id, engine, date, geo_score, mention_score"
        ).in_("keyword_id", keyword_ids).lt(
            "date", str(datetime.now(timezone.utc).date())
        ).order("date", desc=True).execute().data or []
        if previous_rows:
            last_date = previous_rows[0]["date"]
            previous_scores = [
                {
                    "keyword_id": r["keyword_id"],
                    "engine": r["engine"],
                    "geo_score": float(r["geo_score"]),
                    "mention_score": float(r["mention_score"]),
                }
                for r in previous_rows if r["date"] == last_date
            ]
            scan_delta = compute_scan_delta(previous_scores, current_score_rows)

    report_md = await generate_report(
        brand_name=brand["name"],
        scores_by_engine=avg_scores,
        keyword_scores=keyword_scores,
        sample_response=sample_responses[0] if sample_responses else "Marca não foi mencionada esta semana.",
        api_key=settings.anthropic_api_key,
    )

    _today = datetime.now(timezone.utc).date()
    _period_start = _today - timedelta(days=_today.weekday())
    _period_end = _period_start + timedelta(days=6)

    db.table("reports").insert({
        "brand_id": brand["id"],
        "period_start": str(_period_start),
        "period_end": str(_period_end),
        "content_md": report_md,
    }).execute()

    # Send weekly report + alert emails (non-blocking: errors logged, job not failed)
    if settings.resend_api_key:
        try:
            from app.email.sender import send_weekly_report_email, send_alert_email
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
                        score_change=scan_delta["score_change"],
                        report_url="https://app.velo.com.br/report",
                        top_action=top_action_text,
                    )
                    if scan_delta["should_alert"]:
                        terms_by_id = {k["id"]: k["term"] for k in keywords}
                        send_alert_email(
                            api_key=settings.resend_api_key,
                            to_email=to_email,
                            brand_name=brand["name"],
                            score_change=scan_delta["score_change"],
                            lost_keywords=[
                                {"term": terms_by_id.get(lm["keyword_id"], "?"), "engine": lm["engine"]}
                                for lm in scan_delta["lost_mentions"]
                            ],
                            dashboard_url="https://app.velo.com.br/dashboard",
                        )
        except Exception as email_err:
            logger.warning("Erro ao enviar email de relatório: %s", email_err)

    db.table("jobs").update({
        "status": "done",
        "completed_at": "now()",
    }).eq("id", job_id).execute()

    logger.info("Job %s concluído com sucesso.", job_id)
