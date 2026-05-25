"use client";

import RecruiterLayout from "./RecruiterLayout";

type RecruiterPageProps = {
    defaultWorkspace?: "overview" | "jobs" | "applications";
};

export default function RecruiterPage({ defaultWorkspace = "overview" }: RecruiterPageProps) {
    const defaultPage =
        defaultWorkspace === "jobs" ? "jobs"
            : defaultWorkspace === "applications" ? "cvs"
                : "dashboard";
    return <RecruiterLayout defaultPage={defaultPage as "dashboard" | "jobs" | "cvs"} />;
}
