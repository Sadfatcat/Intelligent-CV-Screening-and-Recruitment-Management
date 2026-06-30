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
            
            # Legacy and Criteria keys union
            ALLOWED_KEYS = {
                "technical_skills", "programming_languages", "experience", "projects", "responsibilities", "natural_languages", "soft_skills", "certificates", "education",
                "required_skills", "project_domain", "seniority", "responsibility", "testing_documentation", "language_collaboration", "bonus_skills"
            }
            
            cleaned_weights: dict[str, float] = {}
            for key, value in weights.items():
                if key not in ALLOWED_KEYS:
                    continue
                try:
                    weight = float(value)
                except (TypeError, ValueError) as exc:
                    raise ValueError(f"Invalid weight for section '{key}'") from exc
                if weight < 0:
                    raise ValueError(f"Weight for section '{key}' must be non-negative")
                cleaned_weights[key] = weight
            
            # Map weights to criteria-based keys
            mapped_weights: dict[str, float] = {}
            for key, weight in cleaned_weights.items():
                if key in {
                    "required_skills", "project_domain", "seniority", "responsibility",
                    "testing_documentation", "language_collaboration", "bonus_skills"
                }:
                    mapped_weights[key] = mapped_weights.get(key, 0.0) + weight
                elif key in {"technical_skills", "programming_languages"}:
                    mapped_weights["required_skills"] = mapped_weights.get("required_skills", 0.0) + weight
                elif key == "experience":
                    mapped_weights["seniority"] = mapped_weights.get("seniority", 0.0) + weight
                elif key == "projects":
                    mapped_weights["project_domain"] = mapped_weights.get("project_domain", 0.0) + weight
                elif key == "responsibilities":
                    mapped_weights["responsibility"] = mapped_weights.get("responsibility", 0.0) + weight
                elif key in {"natural_languages", "soft_skills"}:
                    mapped_weights["language_collaboration"] = mapped_weights.get("language_collaboration", 0.0) + weight
                elif key in {"certificates", "education"}:
                    mapped_weights["bonus_skills"] = mapped_weights.get("bonus_skills", 0.0) + weight
                    
            if cleaned_weights and not mapped_weights:
                raise ValueError("No valid matching config weights specified")
                
            total = sum(mapped_weights.values())
            if total > 0:
                mapped_weights = {k: v / total for k, v in mapped_weights.items()}
            elif cleaned_weights:
                raise ValueError("At least one configured weight must be greater than zero")
                
            if mapped_weights:
                config["weights"] = {k: round(v, 4) for k, v in mapped_weights.items()}

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
