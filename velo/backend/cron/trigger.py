import httpx
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main() -> None:
    api_url = os.environ["INTERNAL_API_URL"].rstrip("/")
    api_key = os.environ["INTERNAL_API_KEY"]
    try:
        resp = httpx.post(
            f"{api_url}/internal/create-jobs",
            headers={"X-Internal-Key": api_key},
            timeout=30,
        )
        resp.raise_for_status()
        logger.info("Jobs criados: %s", resp.json())
    except httpx.HTTPStatusError as e:
        logger.error(
            "HTTP error ao criar jobs: %s — %s",
            e.response.status_code,
            e.response.text,
        )
        raise
    except Exception as e:
        logger.error("Erro ao criar jobs: %s", e)
        raise


if __name__ == "__main__":
    main()
