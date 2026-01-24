import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { User, LogOut, CreditCard, Eye, EyeOff, Trash2, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector, languages } from "@/components/LanguageSelector";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { apiRequest, queryClient } from "@/lib/queryClient";

// Plans removed - app is now 100% free with donations

export default function SettingsPage() {
    const { user, logoutMutation } = useAuth();
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const [isEditing, setIsEditing] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoadingPortal, setIsLoadingPortal] = useState(false);
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
            title: t('settings.toast.profileUpdated.title'),
            description: t('settings.toast.profileUpdated.description'),
        });
        setIsEditing(false);
    };

    const handleLanguageChange = async (langCode: string) => {
        await i18n.changeLanguage(langCode);

        // Persist to backend if user is logged in
        if (user) {
            try {
                await fetch('/api/user/language', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: langCode }),
                });

                toast({
                    title: i18n.t('settings.toast.languageUpdated.title'),
                    description: i18n.t('settings.toast.languageUpdated.description'),
                });
            } catch (error) {
                console.error('Failed to sync language with backend:', error);
                toast({
                    title: i18n.t('settings.toast.error.title'),
                    description: i18n.t('settings.toast.error.language'),
                    variant: "destructive"
                });
            }
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setIsDeleting(true);
            await apiRequest("DELETE", "/api/user");

            toast({
                title: t('settings.toast.accountDeleted.title'),
                description: t('settings.toast.accountDeleted.description'),
                variant: "destructive",
            });

            // Clear local state
            queryClient.setQueryData(["/api/auth/user"], null);
            setLocation("/");
        } catch (error) {
            toast({
                title: t('settings.toast.error.title'),
                description: t('settings.toast.error.delete'),
                variant: "destructive",
            });
            setIsDeleting(false);
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsLoadingPortal(true);
        try {
            const res = await fetch("/api/create-portal-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to create portal session");
            }

            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to open billing portal",
                variant: "destructive"
            });
            setIsLoadingPortal(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center cursor-pointer transition-opacity hover:opacity-80">
                        <img src="/logo.png" alt="Competitor Watcher" className="h-10 w-auto dark:invert-0 invert" />
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
                    <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('settings.subtitle')}
                    </p>
                </div>

                {/* Account Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {t('settings.account.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('settings.account.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('settings.account.name')}</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('settings.account.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('language.select')}</Label>
                            <div className="flex flex-col gap-2">
                                <Select
                                    value={languages.find(l => i18n.language.startsWith(l.code))?.code || 'en'}
                                    onValueChange={handleLanguageChange}
                                >
                                    <SelectTrigger className="w-full sm:w-[280px]" data-testid="settings-language-select">
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languages.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code} data-testid={`settings-lang-${lang.code}`}>
                                                {lang.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">
                                    {t('settings.account.languageHint') || "This language will be used for your emails."}
                                </span>
                            </div>
                        </div>

                        {isEditing && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">{t('settings.account.currentPassword')}</Label>
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
                                    <Label htmlFor="new-password">{t('settings.account.newPassword')}</Label>
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
                                    <Label htmlFor="confirm-password">{t('settings.account.confirmPassword')}</Label>
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
                                    <Button onClick={handleSaveProfile}>{t('settings.account.save')}</Button>
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                                        {t('settings.account.cancel')}
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>{t('settings.account.edit')}</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription Management */}
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-500" />
                            {t('settings.subscription.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('settings.subscription.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                                <p className="font-medium">{t('settings.subscription.currentPlan')} <span className="capitalize">{user?.plan || 'free'}</span></p>
                                <p className="text-sm text-muted-foreground">
                                    {user?.plan === 'pro'
                                        ? t('settings.subscription.accessPremium')
                                        : t('settings.subscription.upgradeUnlock')}
                                </p>
                            </div>
                            <Badge variant={user?.plan === 'pro' ? 'default' : 'secondary'}>
                                {user?.plan === 'pro' ? t('settings.subscription.proBadge') : t('settings.subscription.freeBadge')}
                            </Badge>
                        </div>

                        {user?.plan === 'pro' ? (
                            <Button
                                onClick={handleManageSubscription}
                                disabled={isLoadingPortal}
                                className="w-full"
                                variant="outline"
                            >
                                {isLoadingPortal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('settings.subscription.manage')}
                            </Button>
                        ) : (
                            <Link href="/pricing">
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                    {t('settings.subscription.upgrade')}
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <Shield className="h-5 w-5" />
                            {t('settings.danger.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('settings.danger.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{t('settings.danger.deleteAccount')}</p>
                                <p className="text-sm text-muted-foreground">{t('settings.danger.deleteDesc')}</p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('settings.danger.button')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Delete Account Confirmation Dialog */}
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('settings.danger.dialog.title')}</AlertDialogTitle>
                            <AlertDialogDescription dangerouslySetInnerHTML={{ __html: t('settings.danger.dialog.description') }} />
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('settings.danger.dialog.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {t('settings.danger.dialog.confirm')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    );
}
