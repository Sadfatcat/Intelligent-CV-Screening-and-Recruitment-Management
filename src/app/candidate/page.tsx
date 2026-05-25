"use client";

import { Suspense } from "react";
import CandidateLayout from "@/features/candidate/CandidateLayout";

export default function CandidatePage() {
    return (
        <Suspense fallback={<div />}>
            <CandidateLayout />
        </Suspense>
    );
}
