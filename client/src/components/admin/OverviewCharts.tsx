import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export interface AdminSeriesPoint {
    date: string;
    users: number;
    reports: number;
}

// Theme-aware chart styling shared by the admin charts.
export const chartColor = (index: number) => `hsl(var(--chart-${(index % 5) + 1}))`;
export const axisProps = {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
} as const;
export const tooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
} as const;
export const formatDay = (value: string) => value.slice(5); // MM-DD

export function EmptyChart({ message }: { message: string }) {
    return (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed bg-muted/20">
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

function SeriesChart({ data, dataKey, color, title, description }: {
    data: AdminSeriesPoint[];
    dataKey: "users" | "reports";
    color: string;
    title: string;
    description: string;
}) {
    const { t } = useTranslation();
    const gradientId = `admin-gradient-${dataKey}`;
    const hasData = data.some((point) => point[dataKey] > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] pl-2">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" {...axisProps} tickFormatter={formatDay} minTickGap={16} />
                            <YAxis {...axisProps} allowDecimals={false} width={32} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                name={title}
                                stroke={color}
                                fill={`url(#${gradientId})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart message={t("admin.charts.noData")} />
                )}
            </CardContent>
        </Card>
    );
}

export function OverviewCharts({ series, typeDistribution, periodDays }: {
    series: AdminSeriesPoint[];
    typeDistribution: { type: string; count: number }[];
    periodDays: number;
}) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <SeriesChart
                data={series}
                dataKey="users"
                color={chartColor(0)}
                title={t("admin.charts.userGrowth")}
                description={t("admin.charts.lastDays", { count: periodDays })}
            />
            <SeriesChart
                data={series}
                dataKey="reports"
                color={chartColor(3)}
                title={t("admin.charts.reportsGenerated")}
                description={t("admin.charts.lastDays", { count: periodDays })}
            />
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">{t("admin.charts.businessTypes")}</CardTitle>
                    <CardDescription>{t("admin.charts.businessTypesDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {typeDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeDistribution.map((entry) => ({
                                        ...entry,
                                        label: t(`businessTypes.${entry.type}`, entry.type),
                                    }))}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="count"
                                    nameKey="label"
                                    stroke="hsl(var(--background))"
                                >
                                    {typeDistribution.map((entry, index) => (
                                        <Cell key={entry.type} fill={chartColor(index)} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message={t("admin.charts.noData")} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
