"use client";

import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const FALLBACK_COLORS = ["#12161d", "#60a5fa", "#f4a261", "#9bd8b2"];

type Dataset = {
    label: string;
    data: number[];
    color?: string;
};

type Props = {
    labels: string[];
    datasets: Dataset[];
    height?: number;
};

export default function LineChart({ labels, datasets, height = 220 }: Props) {
    const data = {
        labels,
        datasets: datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            backgroundColor: ds.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.35,
            fill: false,
        })),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        plugins: {
            legend: {
                labels: { color: "var(--text, #12161d)", boxWidth: 12, boxHeight: 12 },
            },
        },
        scales: {
            x: {
                ticks: { color: "var(--muted, #666)", autoSkip: true, maxRotation: 0 },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                ticks: { color: "var(--muted, #666)", precision: 0 },
                grid: { color: "rgba(0,0,0,0.06)" },
            },
        },
    };

    return (
        <div style={{ height }}>
            <Line data={data} options={options} />
        </div>
    );
}
