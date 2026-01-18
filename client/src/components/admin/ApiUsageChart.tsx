
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsageData {
    date: string;
    google: number;
    openAi: number;
}

export function ApiUsageChart({ data }: { data: UsageData[] }) {
    // if (!data || data.length === 0) return null; // Don't hide completely

    return (
        <Card className="col-span-1 md:col-span-2 shadow-sm border-l-4 border-l-orange-500">
            <CardHeader>
                <CardTitle>System API Usage & Costs (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    {(!data || data.length === 0) ? (
                        <div className="flex bg-muted/20 h-full items-center justify-center rounded-md border border-dashed">
                            <p className="text-muted-foreground text-sm">No usage data available.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
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
                                    label={{ value: 'Cost Units / Tokens', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="google" name="Google Places (Calls)" fill="#f97316" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="openAi" name="OpenAI (Tokens)" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
