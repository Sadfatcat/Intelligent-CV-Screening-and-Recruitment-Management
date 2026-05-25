"use client";

import { useMemo, useState } from "react";
import type { CVLogItem, CvSortMode, ExperienceFilter, ScoreStatus } from "../types/recruiterTypes";
import {
    filterCvsByExperience,
    filterCvsByStatus,
    getSectionPoints,
    normalizeScore,
    sortCvLogs,
} from "../utils/cvScoringUtils";

export function useCVFilters(submittedCvLogs: CVLogItem[]) {
    const [scoreStatusFilter, setScoreStatusFilter] = useState<ScoreStatus | "all">("all");
    const [scoreRangeFilter, setScoreRangeFilter] = useState<"all" | "85-100" | "50-84" | "0-49">("all");
    const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>("all");
    const [screeningSearch, setScreeningSearch] = useState("");
    const [cvSortMode, setCvSortMode] = useState<CvSortMode>("score");

    const filteredLogs = useMemo(() => {
        const q = screeningSearch.trim().toLowerCase();
        return filterCvsByExperience(filterCvsByStatus(submittedCvLogs, scoreStatusFilter), experienceFilter)
            .filter((log) => {
                const score = normalizeScore(log.ai_matching_score);
                if (scoreRangeFilter === "85-100" && (score === null || score < 85)) return false;
                if (scoreRangeFilter === "50-84" && (score === null || score < 50 || score >= 85)) return false;
                if (scoreRangeFilter === "0-49" && (score === null || score >= 50)) return false;
                if (!q) return true;
                const haystack = [
                    log.candidate_email,
                    log.candidate_phone,
                    log.job_title,
                    ...(log.matching_detail?.good_points ?? []),
                    ...(log.matching_detail?.missing_points ?? []),
                    ...getSectionPoints(log.matching_detail, ["technical_skills", "programming_languages"], "good"),
                    ...getSectionPoints(log.matching_detail, ["technical_skills", "programming_languages"], "missing"),
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(q);
            });
    }, [experienceFilter, scoreRangeFilter, scoreStatusFilter, screeningSearch, submittedCvLogs]);

    const sortedFilteredLogs = useMemo(() => sortCvLogs(filteredLogs, cvSortMode), [cvSortMode, filteredLogs]);

    function clearFilters() {
        setScoreStatusFilter("all");
        setScoreRangeFilter("all");
        setExperienceFilter("all");
        setScreeningSearch("");
        setCvSortMode("score");
    }

    return {
        scoreStatusFilter,
        setScoreStatusFilter,
        scoreRangeFilter,
        setScoreRangeFilter,
        experienceFilter,
        setExperienceFilter,
        screeningSearch,
        setScreeningSearch,
        cvSortMode,
        setCvSortMode,
        sortedFilteredLogs,
        filteredLogsCount: filteredLogs.length,
        clearFilters,
    };
}
