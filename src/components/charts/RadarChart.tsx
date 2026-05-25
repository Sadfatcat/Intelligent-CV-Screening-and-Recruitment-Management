"use client";

import {
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    PointElement,
    RadarController,
    RadialLinearScale,
    Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RADAR_COLORS = [
    "#2563eb",
    "#16a34a",
    "#f97316",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#ca8a04",
    "#db2777",
];

type Props = {
    labels: string[];
    values: number[];
    height?: number;
    labelFontSize?: number;
    tickFontSize?: number;
};

export default function RadarChart({ labels, values, height = 220, labelFontSize = 13, tickFontSize = 11 }: Props) {
    const colors = labels.map((_, index) => RADAR_COLORS[index % RADAR_COLORS.length]);

    const data = {
        labels,
        datasets: [
            {
                label: "Score",
                data: values,
                backgroundColor: "rgba(37, 99, 235, 0.12)",
                borderColor: "rgba(37, 99, 235, 0.72)",
                borderWidth: 3,
                pointBackgroundColor: colors,
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointHoverBackgroundColor: colors,
                pointHoverBorderColor: "#fff",
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 25, color: "var(--muted, #666)", font: { size: tickFontSize } },
                grid: { color: "rgba(0,0,0,0.08)" },
                angleLines: { color: "rgba(0,0,0,0.1)" },
                pointLabels: {
                    color: (ctx: { index: number }) => colors[ctx.index % colors.length],
                    font: { size: labelFontSize, weight: 700 },
                },
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: { parsed: { r: number } }) => `${ctx.parsed.r.toFixed(0)}/100`,
                },
            },
        },
    };

    return (
        <div>
            <div style={{ height }}>
                <Radar data={data} options={options as Parameters<typeof Radar>[0]["options"]} />
            </div>
            <div
                aria-hidden="true"
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px 14px",
                    justifyContent: "center",
                    marginTop: 14,
                }}
            >
                {labels.map((label, index) => (
                    <span
                        key={`${label}-${index}`}
                        style={{
                            alignItems: "center",
                            color: "var(--body-text, #4a4a4a)",
                            display: "inline-flex",
                            fontSize: 13,
                            fontWeight: 700,
                            gap: 6,
                        }}
                    >
                        <i
                            style={{
                                background: colors[index],
                                borderRadius: 999,
                                display: "inline-block",
                                height: 10,
                                width: 10,
                            }}
                        />
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
