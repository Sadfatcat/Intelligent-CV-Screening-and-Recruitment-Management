import json
import sys

sys.path.insert(0, '..')

from app.services.matching_config import parse_matching_config, serialize_matching_config


def test_parse_valid_matching_config_keeps_weights_and_must_have():
    raw = json.dumps({
        "weights": {"technical_skills": 0.8, "experience": 0.2, "unknown": 1},
        "must_have": ["Python", " Docker ", ""],
    })

    config = parse_matching_config(raw, strict=True)

    assert config["weights"] == {"required_skills": 0.8, "seniority": 0.2}
    assert config["must_have"] == ["Python", "Docker"]


def test_parse_invalid_matching_config_falls_back_when_not_strict():
    assert parse_matching_config("{bad json", strict=False) == {}


def test_serialize_invalid_matching_config_raises_for_upload_validation():
    try:
        serialize_matching_config(json.dumps({"weights": {"technical_skills": -1}}))
    except ValueError as exc:
        assert "non-negative" in str(exc)
    else:
        raise AssertionError("Expected invalid matching_config to raise ValueError")
