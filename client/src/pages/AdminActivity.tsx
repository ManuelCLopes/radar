
import { useQuery } from "@tanstack/react-query";
import { type Search } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search as SearchIcon, MapPin } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";

export default function AdminActivity() {
    const { data: searches, isLoading } = useQuery<any[]>({
        queryKey: ["/api/admin/searches"],
    });

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Live Activity</h1>
                    <p className="text-muted-foreground">Real-time stream of what users are searching for.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Searches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {searches?.map((search: any) => (
                                <div key={search.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-2 rounded-full border shadow-sm">
                                            <SearchIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium flex items-center gap-2">
                                                {search.type}
                                                <span className="text-muted-foreground font-normal">near</span>
                                                {search.address}
                                            </p>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                <span>Radius: {search.radius}m</span>
                                                <span>•</span>
                                                <span>{new Date(search.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={search.competitorsFound > 0 ? "default" : "secondary"}>
                                        {search.competitorsFound} found
                                    </Badge>
                                </div>
                            ))}
                            {searches?.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No recent activity recorded.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
