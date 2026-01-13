
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
    userGrowth: { date: string; count: number }[];
    reportStats: { date: string; count: number }[];
}

export function OverviewCharts({ data }: { data: AnalyticsData }) {
    if (!data) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>User Growth (30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data.userGrowth}>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(5)} // Show MM-DD
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Reports Generated (30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.reportStats}>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(5)}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
