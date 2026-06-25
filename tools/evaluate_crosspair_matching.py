import argparse
import csv
import math
import sys
from collections import defaultdict
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
EVALUATION_DIR = ROOT_DIR / "evaluation"
sys.path.insert(0, str(BACKEND_DIR))

from app.services.matcher import score_cv_vs_jd  # noqa: E402


LABELLED_FILE = EVALUATION_DIR / "mau_gan_nhan_crosspair_labelled.csv"
CV_FILE = EVALUATION_DIR / "danh_sach_cv_mock.csv"
JD_FILE = EVALUATION_DIR / "danh_sach_jd_mock.csv"
LABEL_TO_RELEVANCE = {"High": 2, "Medium": 1, "Low": 0}
RELEVANT_LABELS = {"High", "Medium"}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})


def score_to_label(score: float) -> str:
    if score >= 80:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"


def dcg(relevances: list[int]) -> float:
    return sum((2**rel - 1) / math.log2(index + 2) for index, rel in enumerate(relevances))


def ranking_metrics(rows: list[dict[str, str]], k: int = 3) -> dict[str, float]:
    by_jd: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        by_jd[row["jd_id"]].append(row)

    precision_values = []
    recall_values = []
    ndcg_values = []
    for jd_rows in by_jd.values():
        ranked = sorted(jd_rows, key=lambda row: float(row["system_score"]), reverse=True)
        top_k = ranked[:k]
        relevant_total = sum(1 for row in jd_rows if row["human_label"] in RELEVANT_LABELS)
        relevant_in_top_k = sum(1 for row in top_k if row["human_label"] in RELEVANT_LABELS)
        gains = [int(row["human_relevance"]) for row in top_k]
        ideal_gains = sorted([int(row["human_relevance"]) for row in jd_rows], reverse=True)[:k]
        ideal_dcg = dcg(ideal_gains)

        precision_values.append(relevant_in_top_k / k if k else 0.0)
        recall_values.append(relevant_in_top_k / relevant_total if relevant_total else 0.0)
        ndcg_values.append(dcg(gains) / ideal_dcg if ideal_dcg else 0.0)

    return {
        "precision_at_3": sum(precision_values) / len(precision_values) if precision_values else 0.0,
        "recall_at_3": sum(recall_values) / len(recall_values) if recall_values else 0.0,
        "ndcg_at_3": sum(ndcg_values) / len(ndcg_values) if ndcg_values else 0.0,
    }


def summarize(rows: list[dict[str, str]]) -> dict[str, object]:
    accuracy = sum(row["correct"] == "1" for row in rows) / len(rows) if rows else 0.0
    scores_by_label: dict[str, list[float]] = defaultdict(list)
    for row in rows:
        scores_by_label[row["human_label"]].append(float(row["system_score"]))
    averages = {
        label: sum(values) / len(values)
        for label, values in sorted(scores_by_label.items())
    }
    return {"accuracy": accuracy, "averages": averages, **ranking_metrics(rows)}


def compact_items(items: list[str], limit: int = 10) -> str:
    if len(items) <= limit:
        return "; ".join(items)
    return "; ".join(items[:limit]) + f"; ... (+{len(items) - limit} more)"


def evaluate(use_existing_scores: bool) -> tuple[list[dict[str, str]], list[str]]:
    labelled_rows = read_csv(LABELLED_FILE)
    cvs = {row["cv_id"]: row for row in read_csv(CV_FILE)}
    jds = {row["jd_id"]: row for row in read_csv(JD_FILE)}
    results = []
    skipped = []

    for row in labelled_rows:
        case_id = row.get("case_id", "").strip()
        human_label = row.get("human_label", "").strip()
        human_relevance = row.get("human_relevance", "").strip()
        if row.get("evidence_quality") == "insufficient":
            skipped.append(f"case_id={case_id}: evidence_quality is insufficient")
            continue
        if human_label not in LABEL_TO_RELEVANCE:
            skipped.append(f"case_id={case_id}: invalid human_label '{human_label}'")
            continue
        if human_relevance != str(LABEL_TO_RELEVANCE[human_label]):
            skipped.append(f"case_id={case_id}: human_relevance does not match human_label")
            continue

        matched_evidence = row.get("matched_evidence", "")
        missing_evidence = row.get("missing_evidence", "")
        if use_existing_scores:
            system_score = float(row["system_score"])
        else:
            cv = cvs.get(row["cv_id"])
            jd = jds.get(row["jd_id"])
            if not cv or not jd:
                skipped.append(f"case_id={case_id}: missing CV or JD source text")
                continue
            scored = score_cv_vs_jd(cv["cv_text"], jd["jd_text"])
            system_score = float(scored["final_score"])
            matched_evidence = compact_items(scored["good_points"])
            missing_evidence = compact_items(scored["missing_points"])

        predicted_label = score_to_label(system_score)
        results.append({
            "case_id": case_id,
            "jd_id": row.get("jd_id", ""),
            "cv_id": row.get("cv_id", ""),
            "jd_name": row.get("jd_name", ""),
            "cv_name": row.get("cv_name", ""),
            "candidate_email": row.get("candidate_email", ""),
            "pair_type": row.get("pair_type", ""),
            "human_label": human_label,
            "human_relevance": human_relevance,
            "reason": row.get("reason", ""),
            "matched_evidence": matched_evidence,
            "missing_evidence": missing_evidence,
            "system_score": f"{system_score:.3f}",
            "predicted_label": predicted_label,
            "correct": "1" if predicted_label == human_label else "0",
        })

    return results, skipped


def write_summary(path: Path, rows: list[dict[str, str]], skipped: list[str], use_existing_scores: bool) -> dict[str, object]:
    metrics = summarize(rows)
    averages = metrics["averages"]
    lines = [
        "# Cross-pair matcher evaluation",
        "",
        f"Score source: {'existing CSV system_score' if use_existing_scores else 'recomputed matcher output'}",
        f"Evaluated pairs: {len(rows)}",
        f"Accuracy: {metrics['accuracy']:.4f}",
        f"Precision@3: {metrics['precision_at_3']:.4f}",
        f"Recall@3: {metrics['recall_at_3']:.4f}",
        f"NDCG@3: {metrics['ndcg_at_3']:.4f}",
        "",
        "## Average Score By Human Label",
        *[f"- {label}: {value:.3f}" for label, value in averages.items()],
        "",
        "## Skipped Rows",
        *(f"- {item}" for item in skipped),
        *([] if skipped else ["- None"]),
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--use-existing-scores", action="store_true")
    parser.add_argument("--output-prefix", default="crosspair")
    args = parser.parse_args()

    rows, skipped = evaluate(args.use_existing_scores)
    output_csv = EVALUATION_DIR / f"{args.output_prefix}_ket_qua_crosspair.csv"
    output_md = EVALUATION_DIR / f"{args.output_prefix}_tom_tat_crosspair.md"
    columns = [
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
        "matched_evidence",
        "missing_evidence",
        "system_score",
        "predicted_label",
        "correct",
    ]
    write_csv(output_csv, columns, rows)
    metrics = write_summary(output_md, rows, skipped, args.use_existing_scores)

    print(f"Wrote {output_csv.relative_to(ROOT_DIR)}")
    print(f"Wrote {output_md.relative_to(ROOT_DIR)}")
    print(f"accuracy={metrics['accuracy']:.4f}")
    print(
        "average_score_by_label="
        + ", ".join(f"{label}:{value:.3f}" for label, value in metrics["averages"].items())
    )
    print(f"precision_at_3={metrics['precision_at_3']:.4f}")
    print(f"recall_at_3={metrics['recall_at_3']:.4f}")
    print(f"ndcg_at_3={metrics['ndcg_at_3']:.4f}")


if __name__ == "__main__":
    main()
