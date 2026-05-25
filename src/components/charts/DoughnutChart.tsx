"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const FALLBACK_COLORS = ["#12161d", "#60a5fa", "#f4a261", "#9bd8b2", "#f4c48d", "#ef9a9a"];

type Props = {
    labels: string[];
    values: number[];
    colors?: string[];
    height?: number;
};

export default function DoughnutChart({ labels, values, colors, height = 220 }: Props) {
    const bg = colors ?? FALLBACK_COLORS.slice(0, labels.length);

    const data = {
        labels,
        datasets: [
            {
                data: values,
                backgroundColor: bg,
                borderColor: "#fff",
                borderWidth: 4,
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: { color: "var(--text, #12161d)", boxWidth: 12, boxHeight: 12 },
            },
        },
    };

    return (
        <div style={{ height }}>
            <Doughnut data={data} options={options} />
        </div>
    );
}
