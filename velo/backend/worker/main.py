import asyncio
import logging
from app.database import supabase_client
from worker.processor import process_job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

POLL_INTERVAL = 30  # segundos
BACKOFF = [60, 120, 300]  # tentativas 1, 2, 3


async def run_worker():
    logger.info("Worker iniciado. Polling a cada %ds...", POLL_INTERVAL)
    while True:
        try:
            db = supabase_client()
            result = db.table("jobs").select("id, attempt_count") \
                .eq("status", "pending") \
                .lt("attempt_count", 3) \
                .limit(1) \
                .execute()

            if result.data:
                job = result.data[0]
                job_id = job["id"]
                attempt = job["attempt_count"]
                logger.info("Processando job %s (tentativa %d)", job_id, attempt + 1)

                db.table("jobs").update({
                    "attempt_count": attempt + 1
                }).eq("id", job_id).execute()

                try:
                    await process_job(job_id)
                except Exception as e:
                    logger.error("Job %s falhou: %s", job_id, e)
                    new_status = "failed" if attempt + 1 >= 3 else "pending"
                    db.table("jobs").update({
                        "status": new_status,
                        "error_message": str(e),
                    }).eq("id", job_id).execute()

                    if attempt + 1 < 3:
                        wait = BACKOFF[attempt]
                        logger.info("Aguardando %ds antes de retentar...", wait)
                        await asyncio.sleep(wait)
            else:
                await asyncio.sleep(POLL_INTERVAL)

        except Exception as e:
            logger.error("Erro no loop do worker: %s", e)
            await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(run_worker())
