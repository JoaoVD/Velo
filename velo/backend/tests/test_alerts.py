from app.analysis.alerts import compute_scan_delta


def _score(keyword_id, engine, geo, mention):
    return {
        "keyword_id": keyword_id,
        "engine": engine,
        "geo_score": geo,
        "mention_score": mention,
    }


def test_no_previous_scan_means_no_alert():
    current = [_score("k1", "chatgpt", 80.0, 100.0)]
    result = compute_scan_delta(previous=[], current=current)
    assert result["score_change"] == 0
    assert result["lost_mentions"] == []
    assert result["should_alert"] is False


def test_score_change_is_average_difference():
    previous = [
        _score("k1", "chatgpt", 60.0, 100.0),
        _score("k1", "gemini", 40.0, 100.0),
    ]
    current = [
        _score("k1", "chatgpt", 70.0, 100.0),
        _score("k1", "gemini", 60.0, 100.0),
    ]
    result = compute_scan_delta(previous=previous, current=current)
    assert result["score_change"] == 15  # avg 65 - avg 50
    assert result["should_alert"] is False


def test_drop_of_ten_points_triggers_alert():
    previous = [_score("k1", "chatgpt", 70.0, 100.0)]
    current = [_score("k1", "chatgpt", 60.0, 100.0)]
    result = compute_scan_delta(previous=previous, current=current)
    assert result["score_change"] == -10
    assert result["should_alert"] is True


def test_small_drop_does_not_trigger_alert():
    previous = [_score("k1", "chatgpt", 70.0, 100.0)]
    current = [_score("k1", "chatgpt", 65.0, 100.0)]
    result = compute_scan_delta(previous=previous, current=current)
    assert result["score_change"] == -5
    assert result["should_alert"] is False


def test_lost_mention_triggers_alert():
    previous = [
        _score("k1", "chatgpt", 70.0, 100.0),
        _score("k2", "chatgpt", 70.0, 100.0),
    ]
    current = [
        _score("k1", "chatgpt", 72.0, 100.0),
        _score("k2", "chatgpt", 68.0, 0.0),
    ]
    result = compute_scan_delta(previous=previous, current=current)
    assert result["lost_mentions"] == [{"keyword_id": "k2", "engine": "chatgpt"}]
    assert result["should_alert"] is True


def test_keyword_never_mentioned_is_not_a_lost_mention():
    previous = [_score("k1", "chatgpt", 0.0, 0.0)]
    current = [_score("k1", "chatgpt", 0.0, 0.0)]
    result = compute_scan_delta(previous=previous, current=current)
    assert result["lost_mentions"] == []
    assert result["should_alert"] is False


def test_new_keyword_without_previous_data_is_ignored_for_loss():
    previous = [_score("k1", "chatgpt", 70.0, 100.0)]
    current = [
        _score("k1", "chatgpt", 70.0, 100.0),
        _score("k2", "chatgpt", 0.0, 0.0),  # nova keyword, sem histórico
    ]
    result = compute_scan_delta(previous=previous, current=current)
    assert result["lost_mentions"] == []
    assert result["should_alert"] is False
