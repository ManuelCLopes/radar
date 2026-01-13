
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Activity, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location] = useLocation();
    const { logoutMutation } = useAuth();

    const menuItems = [
        { href: "/admin", icon: LayoutDashboard, label: "Overview" },
        { href: "/admin/users", icon: Users, label: "Users" },
        { href: "/admin/activity", icon: Activity, label: "Activity" },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">Radar Admin</h1>
                    <p className="text-sm text-gray-500">Mission Control</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-700 hover:bg-gray-100/50 hover:text-gray-900"
                                    }`}>
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </a>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => logoutMutation.mutate()}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
