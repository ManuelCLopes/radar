import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { User, CreditCard, Shield, LogOut, BarChart3, Eye, EyeOff, Trash2 } from "lucide-react";
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

const plans = [
    { id: "essential", name: "Essential", price: "9.90€", features: ["1 localização", "Relatórios quinzenais", "Raio até 5 km"] },
    { id: "professional", name: "Professional", price: "29.90€", features: ["5 localizações", "Relatórios semanais", "Análise SWOT avançada"] },
    { id: "agency", name: "Agency", price: "99.90€", features: ["Localizações ilimitadas", "Relatórios diários", "API access"] },
];

export default function SettingsPage() {
    const { user, logoutMutation } = useAuth();
    const { t } = useTranslation();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [showPlanConfirm, setShowPlanConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.firstName || user?.email || "",
        email: user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const currentPlan = user?.plan || "essential";

    const handleSaveProfile = async () => {
        toast({
            title: "Perfil atualizado",
            description: "As suas informações foram guardadas com sucesso.",
        });
        setIsEditing(false);
    };

    const handlePlanClick = (planId: string) => {
        if (planId !== currentPlan) {
            setSelectedPlan(planId);
            setShowPlanConfirm(true);
        }
    };

    const handleConfirmPlanChange = () => {
        if (selectedPlan) {
            toast({
                title: "Plano alterado",
                description: `O seu plano foi atualizado para ${plans.find(p => p.id === selectedPlan)?.name}.`,
            });
            setShowPlanConfirm(false);
            setSelectedPlan(null);
            // TODO: Implement actual plan change API call
        }
    };

    const handleDeleteAccount = () => {
        toast({
            title: "Conta removida",
            description: "A sua conta foi permanentemente removida.",
            variant: "destructive",
        });
        setShowDeleteConfirm(false);
        // TODO: Implement actual account deletion API call
        setTimeout(() => logoutMutation.mutate(), 1500);
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
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
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
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
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
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
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

                {/* Subscription Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Plano de Subscrição
                        </CardTitle>
                        <CardDescription>
                            Gerir o seu plano atual e fazer upgrade
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                                <p className="font-semibold">Plano Atual</p>
                                <p className="text-2xl font-bold mt-1">{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</p>
                            </div>
                            <Badge variant="secondary" className="text-lg px-4 py-2">
                                {plans.find(p => p.id === currentPlan)?.price}/mês
                            </Badge>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <p className="font-semibold">Planos Disponíveis</p>
                            <div className="grid gap-3">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${currentPlan === plan.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                        onClick={() => handlePlanClick(plan.id)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">{plan.name}</h3>
                                                <p className="text-sm text-muted-foreground">{plan.price}/mês</p>
                                            </div>
                                            {currentPlan === plan.id && (
                                                <Badge>Ativo</Badge>
                                            )}
                                        </div>
                                        <ul className="space-y-1 text-sm">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
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

                {/* Plan Change Confirmation Dialog */}
                <AlertDialog open={showPlanConfirm} onOpenChange={setShowPlanConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Mudança de Plano</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem a certeza que pretende alterar o seu plano para{" "}
                                <strong>{plans.find(p => p.id === selectedPlan)?.name}</strong>?
                                Esta alteração será aplicada imediatamente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmPlanChange}>
                                Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

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
