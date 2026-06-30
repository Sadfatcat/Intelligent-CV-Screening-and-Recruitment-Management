"use client";

import { useMemo, useState } from "react";
import type { CVLogItem, CvSortMode, ExperienceFilter, ScoreStatus } from "../types/recruiterTypes";
import {
    BORDERLINE_SCORE_THRESHOLD,
    filterCvsByExperience,
    filterCvsByStatus,
    getMatchedItems,
    getMissingRequirements,
    getMissingSkills,
    normalizeScore,
    PASSED_SCORE_THRESHOLD,
    sortCvLogs,
    WEAK_MATCH_SCORE_THRESHOLD,
} from "../utils/cvScoringUtils";

export function useCVFilters(submittedCvLogs: CVLogItem[]) {
    const [scoreStatusFilter, setScoreStatusFilter] = useState<ScoreStatus | "all">("all");
    const [scoreRangeFilter, setScoreRangeFilter] = useState<"all" | "75-100" | "60-74" | "45-59" | "0-44">("all");
    const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>("all");
    const [screeningSearch, setScreeningSearch] = useState("");
    const [cvSortMode, setCvSortMode] = useState<CvSortMode>("score");

    const filteredLogs = useMemo(() => {
        const q = screeningSearch.trim().toLowerCase();
        return filterCvsByExperience(filterCvsByStatus(submittedCvLogs, scoreStatusFilter), experienceFilter)
            .filter((log) => {
                const score = normalizeScore(log.ai_matching_score);
                if (scoreRangeFilter === "75-100" && (score === null || score < PASSED_SCORE_THRESHOLD)) return false;
                if (scoreRangeFilter === "60-74" && (score === null || score < BORDERLINE_SCORE_THRESHOLD || score >= PASSED_SCORE_THRESHOLD)) return false;
                if (scoreRangeFilter === "45-59" && (score === null || score < WEAK_MATCH_SCORE_THRESHOLD || score >= BORDERLINE_SCORE_THRESHOLD)) return false;
                if (scoreRangeFilter === "0-44" && (score === null || score >= WEAK_MATCH_SCORE_THRESHOLD)) return false;
                if (!q) return true;
                const haystack = [
                    log.candidate_email,
                    log.candidate_phone,
                    log.job_title,
                    ...getMatchedItems(log.matching_detail),
                    ...getMissingSkills(log.matching_detail),
                    ...getMissingRequirements(log.matching_detail),
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
