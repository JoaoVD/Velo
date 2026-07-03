import pytest
from app.analysis.scorer import calculate_geo_score, calculate_competitor_scores


def test_all_mentioned_first_positive():
    analyses = [
        {"mentioned": True, "position": 1, "sentiment": "positive"},
        {"mentioned": True, "position": 1, "sentiment": "positive"},
    ]
    result = calculate_geo_score(analyses)
    assert result["mention_score"] == 100.0
    assert result["position_score"] == 100.0
    assert result["sentiment_score"] == 100.0
    assert result["frequency_score"] == 100.0
    assert result["geo_score"] == 100.0


def test_never_mentioned():
    analyses = [
        {"mentioned": False, "position": None, "sentiment": None},
        {"mentioned": False, "position": None, "sentiment": None},
    ]
    result = calculate_geo_score(analyses)
    assert result["mention_score"] == 0.0
    assert result["position_score"] == 0.0
    assert result["sentiment_score"] == 0.0
    assert result["frequency_score"] == 0.0
    assert result["geo_score"] == 0.0


def test_partial_mention_second_position_positive():
    # 3 of 5 mentions, always 2nd, positive sentiment
    analyses = [
        {"mentioned": True, "position": 2, "sentiment": "positive"},
        {"mentioned": True, "position": 2, "sentiment": "positive"},
        {"mentioned": True, "position": 2, "sentiment": "positive"},
        {"mentioned": False, "position": None, "sentiment": None},
        {"mentioned": False, "position": None, "sentiment": None},
    ]
    result = calculate_geo_score(analyses)
    assert result["frequency_score"] == 60.0
    assert result["position_score"] == 70.0
    assert result["sentiment_score"] == 100.0
    assert result["mention_score"] == 100.0
    # geo = 0.30*100 + 0.25*70 + 0.25*100 + 0.20*60 = 30+17.5+25+12 = 84.5
    assert result["geo_score"] == 84.5


def test_third_position_neutral():
    analyses = [
        {"mentioned": True, "position": 3, "sentiment": "neutral"},
    ]
    result = calculate_geo_score(analyses)
    assert result["position_score"] == 40.0
    assert result["sentiment_score"] == 50.0
    # geo = 0.30*100 + 0.25*40 + 0.25*50 + 0.20*100 = 30+10+12.5+20 = 72.5
    assert result["geo_score"] == 72.5


def test_mixed_sentiment():
    # 2 mentions: one positive, one negative
    analyses = [
        {"mentioned": True, "position": 1, "sentiment": "positive"},
        {"mentioned": True, "position": 1, "sentiment": "negative"},
    ]
    result = calculate_geo_score(analyses)
    assert result["sentiment_score"] == 50.0  # (100 + 0) / 2
    assert result["position_score"] == 100.0
    assert result["frequency_score"] == 100.0
    # geo = 0.30*100 + 0.25*100 + 0.25*50 + 0.20*100 = 30+25+12.5+20 = 87.5
    assert result["geo_score"] == 87.5


def test_fourth_position_maps_to_40():
    analyses = [
        {"mentioned": True, "position": 4, "sentiment": "positive"},
    ]
    result = calculate_geo_score(analyses)
    assert result["position_score"] == 40.0  # 3rd+ = 40


def test_competitor_scores_frequency_and_position():
    analyses = [
        {"mentioned": True, "position": 1, "sentiment": "positive",
         "competitors": {"Rival A": {"mentioned": True, "position": 2},
                         "Rival B": {"mentioned": False, "position": None}}},
        {"mentioned": False, "position": None, "sentiment": None,
         "competitors": {"Rival A": {"mentioned": True, "position": 1},
                         "Rival B": {"mentioned": False, "position": None}}},
    ]
    result = calculate_competitor_scores(analyses, ["Rival A", "Rival B"])
    assert result["Rival A"]["frequency_score"] == 100.0
    assert result["Rival A"]["position_score"] == 85.0  # (70 + 100) / 2
    assert result["Rival B"]["frequency_score"] == 0.0
    assert result["Rival B"]["position_score"] == 0.0


def test_competitor_scores_missing_competitor_data_counts_as_not_mentioned():
    analyses = [
        {"mentioned": True, "position": 1, "sentiment": "positive", "competitors": {}},
        {"mentioned": True, "position": 1, "sentiment": "positive",
         "competitors": {"Rival A": {"mentioned": True, "position": 3}}},
    ]
    result = calculate_competitor_scores(analyses, ["Rival A"])
    assert result["Rival A"]["frequency_score"] == 50.0
    assert result["Rival A"]["position_score"] == 40.0  # fora do POSITION_MAP -> 40


def test_competitor_scores_empty_inputs():
    assert calculate_competitor_scores([], ["Rival A"]) == {"Rival A": {"frequency_score": 0.0, "position_score": 0.0}}
    assert calculate_competitor_scores([{"mentioned": False, "position": None, "sentiment": None, "competitors": {}}], []) == {}
