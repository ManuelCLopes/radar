import { useQuery } from "@tanstack/react-query";
import { type Search } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, MapPin } from "lucide-react";
import AdminLayout, { AdminLoading } from "@/components/layouts/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function AdminActivity() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { data: searches, isLoading } = useQuery<Search[]>({
        queryKey: ["/api/admin/searches"],
        enabled: user?.role === "admin",
    });

    return (
        <AdminLayout title={t("admin.activity.title")} subtitle={t("admin.activity.subtitle")}>
            {isLoading ? <AdminLoading /> : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{t("admin.activity.recentSearches")}</CardTitle>
                        <CardDescription>{t("admin.activity.recentSearchesDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {searches?.map((search) => (
                                <div key={search.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-muted/30 p-4">
                                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                                        <div className="rounded-full border bg-background p-2 shrink-0">
                                            <SearchIcon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium flex flex-wrap items-center gap-2">
                                                {t(`businessTypes.${search.type}`, search.type)}
                                                <span className="text-muted-foreground font-normal">{t("admin.activity.near")}</span>
                                                <span className="break-words">{search.address}</span>
                                            </p>
                                            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                <span>{t("admin.activity.radius", { radius: search.radius })}</span>
                                                <span>•</span>
                                                <span>{new Date(search.createdAt).toLocaleString(i18n.language)}</span>
                                                <span>•</span>
                                                <span>{search.isPreview ? t("admin.activity.guestPreview") : t("admin.activity.memberAnalysis")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={(search.competitorsFound ?? 0) > 0 ? "default" : "secondary"}
                                        className="self-start sm:self-auto"
                                    >
                                        {t("admin.activity.found", { count: search.competitorsFound ?? 0 })}
                                    </Badge>
                                </div>
                            ))}
                            {(!searches || searches.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t("admin.activity.empty")}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </AdminLayout>
    );
}
