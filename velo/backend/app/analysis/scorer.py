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


def calculate_competitor_scores(
    analyses: list[dict], competitor_names: list[str]
) -> dict:
    """
    analyses: list of analyzer results, each optionally containing
    "competitors": {name: {"mentioned": bool, "position": int|None}}.
    Ausência de dados de um concorrente numa resposta conta como não mencionado.

    Returns: {name: {"frequency_score": float, "position_score": float}} (0-100).
    """
    result = {}
    n = len(analyses)
    for name in competitor_names:
        entries = [
            a.get("competitors", {}).get(name)
            for a in analyses
        ]
        mentioned = [e for e in entries if e and e.get("mentioned")]
        frequency_score = (len(mentioned) / n) * 100 if n else 0.0
        position_score = (
            sum(POSITION_MAP.get(e.get("position"), 40.0) for e in mentioned) / len(mentioned)
            if mentioned else 0.0
        )
        result[name] = {
            "frequency_score": round(frequency_score, 2),
            "position_score": round(position_score, 2),
        }
    return result
