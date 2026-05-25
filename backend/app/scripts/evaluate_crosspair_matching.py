import csv
import math
from collections import defaultdict
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
EVALUATION_DIR = ROOT_DIR / "evaluation"
LABEL_TEMPLATE_FILE = EVALUATION_DIR / "mau_gan_nhan_crosspair.csv"
RESULTS_FILE = EVALUATION_DIR / "ket_qua_crosspair.csv"
SUMMARY_FILE = EVALUATION_DIR / "tom_tat_crosspair.md"

LABEL_TO_RELEVANCE = {"High": 2, "Medium": 1, "Low": 0}
RELEVANT_LABELS = {"High", "Medium"}


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def _write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})


def _score_to_label(score: float) -> str:
    if score >= 80:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


def _safe_float(value: str) -> float | None:
    try:
        if value is None or str(value).strip() == "":
            return None
        return float(value)
    except ValueError:
        return None


def _dcg(relevances: list[int]) -> float:
    return sum((2 ** rel - 1) / math.log2(index + 2) for index, rel in enumerate(relevances))


def _ranking_metrics(rows: list[dict[str, str]], k: int = 3) -> tuple[list[dict[str, str]], dict[str, float]]:
    by_jd: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_jd[row["jd_id"]].append(row)

    metric_rows: list[dict[str, str]] = []
    precision_values: list[float] = []
    recall_values: list[float] = []
    ndcg_values: list[float] = []

    for jd_id, jd_rows in sorted(by_jd.items(), key=lambda item: item[0]):
        ranked = sorted(jd_rows, key=lambda row: float(row["system_score"]), reverse=True)
        top_k = ranked[:k]
        relevant_total = sum(1 for row in jd_rows if row["human_label"] in RELEVANT_LABELS)
        relevant_in_top_k = sum(1 for row in top_k if row["human_label"] in RELEVANT_LABELS)
        precision = relevant_in_top_k / k if k else 0.0
        recall = relevant_in_top_k / relevant_total if relevant_total else 0.0

        gains = [int(row["human_relevance"]) for row in top_k]
        ideal_gains = sorted([int(row["human_relevance"]) for row in jd_rows], reverse=True)[:k]
        ideal_dcg = _dcg(ideal_gains)
        ndcg = _dcg(gains) / ideal_dcg if ideal_dcg else 0.0

        precision_values.append(precision)
        recall_values.append(recall)
        ndcg_values.append(ndcg)
        metric_rows.append({
            "jd_id": jd_id,
            "jd_name": ranked[0].get("jd_name", ""),
            "evaluated_pairs": str(len(jd_rows)),
            "relevant_pairs": str(relevant_total),
            "precision_at_3": f"{precision:.4f}",
            "recall_at_3": f"{recall:.4f}",
            "ndcg_at_3": f"{ndcg:.4f}",
        })

    macro = {
        "precision_at_3": sum(precision_values) / len(precision_values) if precision_values else 0.0,
        "recall_at_3": sum(recall_values) / len(recall_values) if recall_values else 0.0,
        "ndcg_at_3": sum(ndcg_values) / len(ndcg_values) if ndcg_values else 0.0,
    }
    return metric_rows, macro


def main() -> None:
    labelled_rows = _read_csv(LABEL_TEMPLATE_FILE)
    results: list[dict[str, str]] = []
    skipped: list[str] = []

    for row in labelled_rows:
        case_id = row.get("case_id", "").strip()
        human_label = row.get("human_label", "").strip()
        human_relevance_raw = row.get("human_relevance", "").strip()
        reason = row.get("reason", "").strip()
        if not human_label and not human_relevance_raw and not reason:
            skipped.append(f"case_id={case_id}: human label fields are blank")
            continue
        if row.get("evidence_quality") == "insufficient":
            skipped.append(f"case_id={case_id}: evidence_quality is insufficient")
            continue
        if human_label not in LABEL_TO_RELEVANCE:
            skipped.append(f"case_id={case_id}: invalid human_label '{human_label}'")
            continue

        expected_relevance = LABEL_TO_RELEVANCE[human_label]
        try:
            human_relevance = int(human_relevance_raw)
        except ValueError:
            skipped.append(f"case_id={case_id}: invalid human_relevance '{human_relevance_raw}'")
            continue
        if human_relevance != expected_relevance:
            skipped.append(
                f"case_id={case_id}: human_relevance {human_relevance} does not match {human_label}={expected_relevance}"
            )
            continue

        system_score = _safe_float(row.get("system_score", ""))
        if system_score is None:
            skipped.append(f"case_id={case_id}: missing system_score")
            continue

        predicted_label = _score_to_label(system_score)
        results.append({
            "case_id": case_id,
            "jd_id": row.get("jd_id", ""),
            "cv_id": row.get("cv_id", ""),
            "jd_name": row.get("jd_name", ""),
            "cv_name": row.get("cv_name", ""),
            "candidate_email": row.get("candidate_email", ""),
            "pair_type": row.get("pair_type", ""),
            "human_label": human_label,
            "human_relevance": str(human_relevance),
            "reason": reason,
            "system_score": f"{system_score:.3f}",
            "predicted_label": predicted_label,
            "correct": "1" if predicted_label == human_label else "0",
        })

    result_columns = [
        "case_id",
        "jd_id",
        "cv_id",
        "jd_name",
        "cv_name",
        "candidate_email",
        "pair_type",
        "human_label",
        "human_relevance",
        "reason",
        "system_score",
        "predicted_label",
        "correct",
    ]
    _write_csv(RESULTS_FILE, result_columns, results)

    count = len(results)
    accuracy = sum(1 for row in results if row["correct"] == "1") / count if count else 0.0
    scores_by_label: dict[str, list[float]] = defaultdict(list)
    for row in results:
        scores_by_label[row["human_label"]].append(float(row["system_score"]))
    average_lines = [
        f"- {label}: {sum(values) / len(values):.3f}" for label, values in sorted(scores_by_label.items())
    ] or ["- Not available"]

    ranking_rows, macro = _ranking_metrics(results, k=3)
    ranking_lines = [
        f"- jd_id={row['jd_id']} ({row['jd_name']}): "
        f"P@3={row['precision_at_3']}, R@3={row['recall_at_3']}, NDCG@3={row['ndcg_at_3']} "
        f"over {row['evaluated_pairs']} pairs"
        for row in ranking_rows
    ] or ["- Not available"]

    SUMMARY_FILE.write_text(
        "\n".join([
            "# Tom tat danh gia cross-pair",
            "",
            "File nay duoc sinh tu `mau_gan_nhan_crosspair.csv` sau khi sinh vien dien human labels.",
            "",
            f"Evaluated pairs: {count}",
            f"Classification accuracy: {accuracy:.4f}",
            "",
            "## Average System Score By Human Label",
            *average_lines,
            "",
            "## Ranking Metrics Per JD",
            *ranking_lines,
            "",
            "## Macro Averages",
            f"- Precision@3: {macro['precision_at_3']:.4f}",
            f"- Recall@3: {macro['recall_at_3']:.4f}",
            f"- NDCG@3: {macro['ndcg_at_3']:.4f}",
            "",
            "## Skipped Rows",
            *(f"- {item}" for item in skipped),
            *([] if skipped else ["- None"]),
            "",
            "## Notes",
            "- High and Medium are treated as relevant for Precision@3 and Recall@3.",
            "- Human labels must be manually assigned or reviewed by the student.",
            "- This is a preliminary evaluation set, not a formal labelled benchmark.",
        ]),
        encoding="utf-8",
    )

    print(f"Wrote {RESULTS_FILE.relative_to(ROOT_DIR)} ({len(results)} evaluated rows)")
    print(f"Wrote {SUMMARY_FILE.relative_to(ROOT_DIR)}")
    print(f"Skipped rows: {len(skipped)}")


if __name__ == "__main__":
    main()
