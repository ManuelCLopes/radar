import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Activity, LogOut, ClipboardList, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

// Shared shell for every admin page: same header as the dashboard, tab-style
// navigation between admin sections, and the admin-only guard.
export default function AdminLayout({ title, subtitle, actions, children }: AdminLayoutProps) {
    const [location, setLocation] = useLocation();
    const { user, isLoading, logoutMutation } = useAuth();
    const { t } = useTranslation();
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            setLocation(user ? "/dashboard" : "/login");
        }
    }, [isLoading, isAdmin, user, setLocation]);

    const menuItems = [
        { href: "/admin", icon: LayoutDashboard, label: t("admin.layout.navigation.overview") },
        { href: "/admin/users", icon: Users, label: t("admin.layout.navigation.users") },
        { href: "/admin/waitlist", icon: ClipboardList, label: t("admin.layout.navigation.waitlist") },
        { href: "/admin/activity", icon: Activity, label: t("admin.layout.navigation.activity") },
    ];

    if (isLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href="/dashboard" className="flex items-center cursor-pointer transition-opacity hover:opacity-80 shrink-0">
                            <img src="/logo-dark.png" alt="Competitor Watcher" className="h-10 w-auto dark:hidden" />
                            <img src="/logo.png" alt="Competitor Watcher" className="h-10 w-auto hidden dark:block" />
                        </Link>
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t("admin.layout.badge")}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" title={t("admin.layout.backToApp")}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline ml-2">{t("admin.layout.backToApp")}</span>
                            </Button>
                        </Link>
                        <LanguageSelector />
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => logoutMutation.mutate()}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title={t("admin.layout.signOut")}
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="sr-only">{t("admin.layout.signOut")}</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-6">
                <nav
                    aria-label={t("admin.layout.brand")}
                    className="inline-flex max-w-full overflow-x-auto h-10 items-center rounded-md bg-muted p-1 text-muted-foreground"
                >
                    {menuItems.map((item) => {
                        const isActive = location === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    isActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {/* Same pattern as the dashboard tabs: icons only on small screens, except the active tab. */}
                                <span className={cn(!isActive && "sr-only sm:not-sr-only")}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
                    </div>
                    {actions}
                </div>

                {children}
            </main>
        </div>
    );
}

export function AdminLoading() {
    return (
        <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
}
