
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
import { Loader2, Search, Trash2, Shield, ShieldOff } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminUsers() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
            const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Role updated successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to update role",
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
            toast({ title: "User deleted successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to delete user",
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
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage users, roles, and permissions.</p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle>Users</CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                            <Table className="min-w-[720px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers?.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.firstName} {user.lastName}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isVerified ? "outline" : "destructive"} className={user.isVerified ? "border-green-500 text-green-700 bg-green-50" : ""}>
                                                    {user.isVerified ? "Verified" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.createdAt && new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        updateRoleMutation.mutate({
                                                            userId: user.id,
                                                            role: user.role === "admin" ? "user" : "admin",
                                                        })
                                                    }
                                                    disabled={updateRoleMutation.isPending}
                                                >
                                                    {user.role === "admin" ? (
                                                        <ShieldOff className="h-4 w-4" />
                                                    ) : (
                                                        <Shield className="h-4 w-4" />
                                                    )}
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the user
                                                                account and remove their data from our servers.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-600 hover:bg-red-700"
                                                                onClick={() => deleteUserMutation.mutate(user.id)}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
