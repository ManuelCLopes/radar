
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConsumerStats {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    totalRequests: number;
    totalCost: number;
}

export function TopConsumersTable({ data }: { data: ConsumerStats[] }) {
    const { t } = useTranslation();
    // if (!data || data.length === 0) return null; // Don't hide completely

    return (
        <Card className="col-span-1 md:col-span-2 shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{t("admin.consumers.title")}</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <Table className="min-w-[480px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("admin.consumers.columns.user")}</TableHead>
                            <TableHead className="text-right">{t("admin.consumers.columns.requests")}</TableHead>
                            <TableHead className="text-right">{t("admin.consumers.columns.cost")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!data || data.length === 0) ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    {t("admin.consumers.noData")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((user) => (
                                <TableRow key={user.userId}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {user.firstName} {user.lastName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {user.email}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{user.totalRequests}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {user.totalCost}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
