import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { axisProps, chartColor, EmptyChart, formatDay, tooltipStyle } from "./OverviewCharts";

export interface ApiUsageSummary {
    daily: { date: string; google: number; openAi: number }[];
    totals: { googleCalls: number; openAiCalls: number; openAiTokens: number };
}

export function ApiUsageChart({ data }: { data?: ApiUsageSummary }) {
    const { t, i18n } = useTranslation();
    const hasData = !!data && (data.totals.googleCalls > 0 || data.totals.openAiCalls > 0);
    const format = (value: number) => value.toLocaleString(i18n.language);

    return (
        <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-lg">{t("admin.charts.apiUsage")}</CardTitle>
                <CardDescription>
                    {data
                        ? t("admin.charts.apiUsageTotals", {
                            google: format(data.totals.googleCalls),
                            openAi: format(data.totals.openAiCalls),
                            tokens: format(data.totals.openAiTokens),
                        })
                        : t("admin.charts.noUsage")}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pl-2">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data!.daily}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" {...axisProps} tickFormatter={formatDay} minTickGap={16} />
                            <YAxis {...axisProps} allowDecimals={false} width={32} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                            <Legend />
                            <Bar dataKey="google" name={t("admin.charts.googlePlaces")} fill={chartColor(1)} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="openAi" name={t("admin.charts.openAi")} fill={chartColor(0)} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart message={t("admin.charts.noUsage")} />
                )}
            </CardContent>
        </Card>
    );
}
