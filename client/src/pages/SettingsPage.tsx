import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { User, BarChart3, LogOut, Heart, Eye, EyeOff, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Plans removed - app is now 100% free with donations

export default function SettingsPage() {
    const { user, logoutMutation } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const [isEditing, setIsEditing] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    // Plan state removed - using donation model
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.firstName || user?.email || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleSaveProfile = async () => {
        toast({
            title: "Perfil atualizado",
            description: "As suas informações foram guardadas com sucesso.",
        });
        setIsEditing(false);
    };

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true);
            await apiRequest("DELETE", "/api/user");

            toast({
                title: "Conta removida",
                description: "A sua conta foi permanentemente removida.",
                variant: "destructive",
            });

            // Clear local state
            queryClient.setQueryData(["/api/auth/user"], null);
            setLocation("/");
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível remover a conta. Tente novamente.",
                variant: "destructive",
            });
            setIsDeleting(false);
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary cursor-pointer transition-opacity hover:opacity-80">
                        <BarChart3 className="h-6 w-6" />
                        <span>Radar</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <LanguageSelector />
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => logoutMutation.mutate()}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Definições</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerir a sua conta e preferências
                    </p>
                </div>

                {/* Account Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informação da Conta
                        </CardTitle>
                        <CardDescription>
                            Atualize os seus dados pessoais e credenciais
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        {isEditing && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Password Atual</Label>
                                    <div className="relative">
                                        <Input
                                            id="current-password"
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            className="pr-10"
                                        />
                                        <span
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Nova Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showNewPassword ? "text" : "password"}
                                            value={formData.newPassword}
                                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="pr-10"
                                        />
                                        <span
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirmar Nova Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="pr-10"
                                        />
                                        <span
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex gap-2 pt-4">
                            {isEditing ? (
                                <>
                                    <Button onClick={handleSaveProfile}>Guardar Alterações</Button>
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                                        Cancelar
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Support Radar - Donation Card */}
                <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" />
                            Apoiar o Radar
                        </CardTitle>
                        <CardDescription>
                            O Radar é 100% gratuito e open source. Ajude a manter o projeto!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                            <p className="text-sm mb-3">
                                <strong>Todas as funcionalidades</strong> estão desbloqueadas para todos.
                                Se o Radar te ajuda, considera apoiar com uma doação.
                            </p>
                            <Link href="/support">
                                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                    <Heart className="mr-2 h-4 w-4" />
                                    Ver Opções de Apoio
                                </Button>
                            </Link>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p>💜 GitHub Sponsors • ☕ Ko-fi • 🎁 Buy Me a Coffee</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <Shield className="h-5 w-5" />
                            Zona de Perigo
                        </CardTitle>
                        <CardDescription>
                            Ações irreversíveis relacionadas com a sua conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Remover Conta</p>
                                <p className="text-sm text-muted-foreground">Eliminar permanentemente a sua conta e todos os dados</p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar Conta
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Delete Account Confirmation Dialog */}
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Conta</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação é <strong className="text-destructive">permanente e irreversível</strong>.
                                Todos os seus dados, relatórios e configurações serão eliminados.
                                Tem a certeza absoluta que pretende continuar?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Sim, Eliminar Conta
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    );
}
