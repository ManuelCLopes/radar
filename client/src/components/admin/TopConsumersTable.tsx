import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export interface ConsumerStats {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    totalRequests: number;
    totalCost: number;
}

export function TopConsumersTable({ data }: { data?: ConsumerStats[] }) {
    const { t, i18n } = useTranslation();

    return (
        <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-lg">{t("admin.consumers.title")}</CardTitle>
                <CardDescription>{t("admin.consumers.description")}</CardDescription>
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
                            {!data || data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        {t("admin.consumers.noData")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((consumer) => {
                                    const name = [consumer.firstName, consumer.lastName].filter(Boolean).join(" ");
                                    return (
                                        <TableRow key={consumer.userId}>
                                            <TableCell>
                                                <div className="font-medium">{name || consumer.email || t("admin.consumers.deletedUser")}</div>
                                                {name && consumer.email && (
                                                    <div className="text-xs text-muted-foreground">{consumer.email}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {Number(consumer.totalRequests).toLocaleString(i18n.language)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold tabular-nums">
                                                {Number(consumer.totalCost).toLocaleString(i18n.language)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
