import asyncio
import logging
from datetime import date
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
            db.table("action_plans").insert({
                "keyword_id": keyword["id"],
                "engine": engine,
                "recommendation": action["recommendation"],
                "priority": action["priority"],
            }).execute()

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

    db.table("reports").insert({
        "brand_id": brand["id"],
        "period_start": str(date.today()),
        "period_end": str(date.today()),
        "content_md": report_md,
    }).execute()

    db.table("jobs").update({
        "status": "done",
        "completed_at": "now()",
    }).eq("id", job_id).execute()

    logger.info("Job %s concluído com sucesso.", job_id)
