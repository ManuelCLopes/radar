import { useQuery } from "@tanstack/react-query";
import { BillingWaitlistLead } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import AdminLayout, { AdminLoading } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AdminWaitlist() {
    const [searchTerm, setSearchTerm] = useState("");
    const { t } = useTranslation();
    const { user } = useAuth();

    const { data: leads, isLoading } = useQuery<BillingWaitlistLead[]>({
        queryKey: ["/api/admin/billing-waitlist"],
        enabled: user?.role === "admin",
    });

    const filteredLeads = leads?.filter((lead) => {
        const query = searchTerm.toLowerCase();
        return (
            lead.email.toLowerCase().includes(query) ||
            lead.plan.toLowerCase().includes(query) ||
            (lead.message && lead.message.toLowerCase().includes(query))
        );
    });

    return (
        <AdminLayout title={t("admin.waitlist.title")} subtitle={t("admin.waitlist.subtitle")}>
            {isLoading ? <AdminLoading /> : (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>{t("admin.waitlist.table.title")}</CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("admin.waitlist.table.searchPlaceholder")}
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                            <Table className="min-w-[840px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("admin.waitlist.table.columns.email")}</TableHead>
                                        <TableHead>{t("admin.waitlist.table.columns.plan")}</TableHead>
                                        <TableHead>{t("admin.waitlist.table.columns.message")}</TableHead>
                                        <TableHead>{t("admin.waitlist.table.columns.source")}</TableHead>
                                        <TableHead>{t("admin.waitlist.table.columns.joined")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads?.length ? (
                                        filteredLeads.map((lead) => (
                                            <TableRow key={lead.id}>
                                                <TableCell className="font-medium">{lead.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={lead.plan === "agency" ? "default" : "secondary"}>
                                                        {lead.plan}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-md truncate">
                                                    {lead.message || t("admin.waitlist.table.noMessage")}
                                                </TableCell>
                                                <TableCell>{lead.source}</TableCell>
                                                <TableCell>
                                                    {lead.createdAt && new Date(lead.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                {t("admin.waitlist.table.empty")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </AdminLayout>
    );
}
