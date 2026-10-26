
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Shield, ShieldOff } from "lucide-react";
import AdminLayout, { AdminLoading } from "@/components/layouts/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

export default function AdminUsers() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
        enabled: currentUser?.role === "admin",
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: t("admin.users.toasts.roleUpdated") });
        },
        onError: (error: any) => {
            toast({
                title: t("admin.users.toasts.roleUpdateError"),
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiRequest("DELETE", `/api/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: t("admin.users.toasts.userDeleted") });
        },
        onError: (error: any) => {
            toast({
                title: t("admin.users.toasts.userDeleteError"),
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const filteredUsers = users?.filter((user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AdminLayout title={t("admin.users.title")} subtitle={t("admin.users.subtitle")}>
            {isLoading ? <AdminLoading /> : (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>{t("admin.users.table.title")}</CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("admin.users.table.searchPlaceholder")}
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                            <Table className="min-w-[820px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("admin.users.table.columns.user")}</TableHead>
                                        <TableHead>{t("admin.users.table.columns.email")}</TableHead>
                                        <TableHead>{t("admin.users.table.columns.plan")}</TableHead>
                                        <TableHead>{t("admin.users.table.columns.role")}</TableHead>
                                        <TableHead>{t("admin.users.table.columns.status")}</TableHead>
                                        <TableHead>{t("admin.users.table.columns.joined")}</TableHead>
                                        <TableHead className="text-right">{t("admin.users.table.columns.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                                {t("admin.users.table.empty")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {filteredUsers?.map((user) => {
                                        const isSelf = user.id === currentUser?.id;
                                        return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.plan === "pro" ? "default" : "outline"}>
                                                    {user.plan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isVerified ? "outline" : "destructive"} className={user.isVerified ? "border-green-500/50 text-green-700 bg-green-500/10 dark:text-green-400" : ""}>
                                                    {user.isVerified ? t("admin.users.table.status.verified") : t("admin.users.table.status.pending")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.createdAt && new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title={user.role === "admin" ? t("admin.users.actions.removeAdmin") : t("admin.users.actions.makeAdmin")}
                                                    aria-label={user.role === "admin" ? t("admin.users.actions.removeAdmin") : t("admin.users.actions.makeAdmin")}
                                                    onClick={() =>
                                                        updateRoleMutation.mutate({
                                                            userId: user.id,
                                                            role: user.role === "admin" ? "user" : "admin",
                                                        })
                                                    }
                                                    disabled={isSelf || updateRoleMutation.isPending}
                                                >
                                                    {user.role === "admin" ? (
                                                        <ShieldOff className="h-4 w-4" />
                                                    ) : (
                                                        <Shield className="h-4 w-4" />
                                                    )}
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isSelf}
                                                            title={t("admin.users.actions.delete")}
                                                            aria-label={t("admin.users.actions.delete")}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("admin.users.deleteDialog.title")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("admin.users.deleteDialog.description")}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => deleteUserMutation.mutate(user.id)}
                                                            >
                                                                {t("admin.users.deleteDialog.confirm")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </AdminLayout>
    );
}
