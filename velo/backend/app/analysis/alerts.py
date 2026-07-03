"""Comparação entre scans para digest semanal e alertas de mudança."""

ALERT_DROP_THRESHOLD = 10


def compute_scan_delta(previous: list[dict], current: list[dict]) -> dict:
    """
    previous/current: lists of {"keyword_id", "engine", "geo_score", "mention_score"}.
    Returns {"score_change": int, "lost_mentions": [{"keyword_id", "engine"}], "should_alert": bool}.

    - score_change: diferença arredondada entre a média de geo_score atual e anterior.
    - lost_mentions: pares (keyword, engine) que tinham menção antes e perderam agora.
    - should_alert: queda >= ALERT_DROP_THRESHOLD ou qualquer menção perdida.

    Sem scan anterior, não há base de comparação: change 0, sem alerta.
    """
    if not previous or not current:
        return {"score_change": 0, "lost_mentions": [], "should_alert": False}

    prev_by_pair = {(s["keyword_id"], s["engine"]): s for s in previous}
    # Compara apenas pares presentes nos dois scans: keyword nova (sem
    # histórico) não pode derrubar a média nem disparar alerta falso.
    common = [s for s in current if (s["keyword_id"], s["engine"]) in prev_by_pair]
    if not common:
        return {"score_change": 0, "lost_mentions": [], "should_alert": False}

    prev_avg = sum(
        prev_by_pair[(s["keyword_id"], s["engine"])]["geo_score"] for s in common
    ) / len(common)
    curr_avg = sum(s["geo_score"] for s in common) / len(common)
    score_change = round(curr_avg - prev_avg)

    prev_mentions = {
        pair: s["mention_score"] for pair, s in prev_by_pair.items()
    }
    lost_mentions = [
        {"keyword_id": s["keyword_id"], "engine": s["engine"]}
        for s in current
        if s["mention_score"] == 0
        and prev_mentions.get((s["keyword_id"], s["engine"]), 0) > 0
    ]

    should_alert = score_change <= -ALERT_DROP_THRESHOLD or bool(lost_mentions)
    return {
        "score_change": score_change,
        "lost_mentions": lost_mentions,
        "should_alert": should_alert,
    }
