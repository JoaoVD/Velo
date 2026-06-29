POSITION_MAP = {1: 100.0, 2: 70.0}
SENTIMENT_MAP = {"positive": 100.0, "neutral": 50.0, "negative": 0.0}

WEIGHTS = {
    "mention": 0.30,
    "position": 0.25,
    "sentiment": 0.25,
    "frequency": 0.20,
}


def calculate_geo_score(analyses: list[dict]) -> dict:
    """
    analyses: list of {"mentioned": bool, "position": int|None, "sentiment": str|None}
    Returns: {"mention_score", "position_score", "sentiment_score", "frequency_score", "geo_score"}
    All values are float, 0-100, rounded to 2 decimal places.
    """
    n = len(analyses)
    mentioned = [a for a in analyses if a["mentioned"]]
    n_mentioned = len(mentioned)

    frequency_score = (n_mentioned / n) * 100
    mention_score = 100.0 if n_mentioned > 0 else 0.0

    if n_mentioned > 0:
        position_score = sum(
            POSITION_MAP.get(a["position"], 40.0) for a in mentioned
        ) / n_mentioned
        sentiment_score = sum(
            SENTIMENT_MAP.get(a["sentiment"], 0.0) for a in mentioned
        ) / n_mentioned
    else:
        position_score = 0.0
        sentiment_score = 0.0

    geo_score = (
        WEIGHTS["mention"] * mention_score
        + WEIGHTS["position"] * position_score
        + WEIGHTS["sentiment"] * sentiment_score
        + WEIGHTS["frequency"] * frequency_score
    )

    return {
        "mention_score": round(mention_score, 2),
        "position_score": round(position_score, 2),
        "sentiment_score": round(sentiment_score, 2),
        "frequency_score": round(frequency_score, 2),
        "geo_score": round(geo_score, 2),
    }
