"use client";

import {
    ArcElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import type { CSSProperties } from "react";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export type DoughnutChartDatum = {
    label: string;
    value: number;
    color: string;
    range?: string;
};

export type LineChartSeries<TPoint extends object> = {
    key: Extract<keyof TPoint, string>;
    label: string;
    color: string;
};

type DashboardDoughnutChartProps = {
    items: DoughnutChartDatum[];
    centerLabel?: string;
    emptyText?: string;
    textColor?: string;
};

type DashboardLineChartProps<TPoint extends object> = {
    points: TPoint[];
    series: Array<LineChartSeries<TPoint>>;
    getLabel: (point: TPoint) => string;
    emptyText?: string;
    textColor?: string;
};

const chartShellStyle = {
    minHeight: 260,
    position: "relative",
} satisfies CSSProperties;

const doughnutGridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 240px) minmax(180px, 1fr)",
    gap: 24,
    alignItems: "center",
} satisfies CSSProperties;

export function DashboardDoughnutChart({
    items,
    centerLabel = "Total",
    emptyText = "No chart data yet.",
    textColor = "#200080",
}: DashboardDoughnutChartProps) {
    const visibleItems = items.filter((item) => item.value > 0);
    const total = visibleItems.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return <p style={{ color: textColor, fontWeight: 800 }}>{emptyText}</p>;
    }

    const data: ChartData<"doughnut"> = {
        labels: visibleItems.map((item) => item.label),
        datasets: [
            {
                data: visibleItems.map((item) => item.value),
                backgroundColor: visibleItems.map((item) => item.color),
                borderColor: "#ffffff",
                borderWidth: 8,
                hoverOffset: 4,
            },
        ],
    };

    const options: ChartOptions<"doughnut"> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "66%",
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label}: ${context.parsed}`,
                },
            },
        },
    };

    return (
        <div style={doughnutGridStyle}>
            <div style={chartShellStyle}>
                <Doughnut data={data} options={options} />
                <div
                    style={{
                        position: "absolute",
                        inset: "50% auto auto 50%",
                        transform: "translate(-50%, -50%)",
                        display: "grid",
                        placeItems: "center",
                        color: textColor,
                        pointerEvents: "none",
                    }}
                >
                    <strong style={{ fontSize: 30, lineHeight: 1 }}>{total}</strong>
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{centerLabel}</span>
                </div>
            </div>
            <div style={{ display: "grid", gap: 10, color: textColor, fontWeight: 800 }}>
                {visibleItems.map((item) => (
                    <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <i style={{ width: 12, height: 12, borderRadius: 999, background: item.color, flex: "0 0 auto" }} />
                        {item.label}{item.range ? `: ${item.range}` : ""} <strong>{item.value}</strong>
                    </span>
                ))}
            </div>
        </div>
    );
}

export function DashboardLineChart<TPoint extends object>({
    points,
    series,
    getLabel,
    emptyText = "No chart data yet.",
    textColor = "#200080",
}: DashboardLineChartProps<TPoint>) {
    if (!points.length) {
        return <p style={{ color: textColor, fontWeight: 800 }}>{emptyText}</p>;
    }

    const data: ChartData<"line"> = {
        labels: points.map(getLabel),
        datasets: series.map((item) => ({
            label: item.label,
            data: points.map((point) => Number((point[item.key] as unknown) || 0)),
            borderColor: item.color,
            backgroundColor: item.color,
            pointBackgroundColor: item.color,
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.35,
            fill: false,
        })),
    };

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    boxWidth: 12,
                    boxHeight: 12,
                    font: { weight: 800 },
                },
            },
        },
        scales: {
            x: {
                ticks: { color: textColor, maxRotation: 0, autoSkip: true },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                ticks: { color: textColor, precision: 0 },
                grid: { color: "rgba(32, 0, 128, 0.1)" },
            },
        },
    };

    return (
        <div style={{ height: 280, minWidth: 0 }}>
            <Line data={data} options={options} />
        </div>
    );
}
