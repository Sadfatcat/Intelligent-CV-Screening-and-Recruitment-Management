import json
from typing import Any

from app.services.matcher import DEFAULT_WEIGHTS


def parse_matching_config(raw_config: str | None, strict: bool = False) -> dict[str, Any]:
    if not raw_config:
        return {}

    try:
        payload = json.loads(raw_config)
        if not isinstance(payload, dict):
            raise ValueError("matching_config must be a JSON object")

        config: dict[str, Any] = {}
        weights = payload.get("weights")
        if weights is not None:
            if not isinstance(weights, dict):
                raise ValueError("matching_config.weights must be an object")
            cleaned_weights: dict[str, float] = {}
            for key, value in weights.items():
                if key not in DEFAULT_WEIGHTS:
                    continue
                try:
                    weight = float(value)
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Invalid weight for section '{key}'") from exc
                if weight < 0:
                    raise ValueError(f"Weight for section '{key}' must be non-negative")
                cleaned_weights[key] = weight
            if cleaned_weights and sum(cleaned_weights.values()) <= 0:
                raise ValueError("At least one configured weight must be greater than zero")
            if cleaned_weights:
                config["weights"] = cleaned_weights

        must_have = payload.get("must_have")
        if must_have is not None:
            if not isinstance(must_have, list):
                raise ValueError("matching_config.must_have must be a list")
            cleaned_must_have = []
            for item in must_have:
                if not isinstance(item, str):
                    raise ValueError("matching_config.must_have items must be strings")
                item = item.strip()
                if item:
                    cleaned_must_have.append(item)
            config["must_have"] = cleaned_must_have

        return config
    except (json.JSONDecodeError, ValueError):
        if strict:
            raise
        return {}


def serialize_matching_config(raw_config: str | None) -> str | None:
    config = parse_matching_config(raw_config, strict=True)
    if not config:
        return None
    return json.dumps(config, ensure_ascii=False)
