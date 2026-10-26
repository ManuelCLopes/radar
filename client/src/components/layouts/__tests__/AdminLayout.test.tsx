import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import AdminLayout from "../AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

vi.mock("@/hooks/useAuth");
vi.mock("wouter", () => ({
    useLocation: vi.fn(),
    Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <div /> }));
vi.mock("@/components/LanguageSelector", () => ({ LanguageSelector: () => <div /> }));

describe("AdminLayout", () => {
    const setLocation = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useLocation as Mock).mockReturnValue(["/admin/users", setLocation]);
    });

    it("sends non-admin users back to the dashboard without rendering content", () => {
        (useAuth as Mock).mockReturnValue({ user: { role: "user" }, isLoading: false, logoutMutation: { mutate: vi.fn() } });
        render(<AdminLayout title="Users"><p>secret</p></AdminLayout>);
        expect(setLocation).toHaveBeenCalledWith("/dashboard");
        expect(screen.queryByText("secret")).not.toBeInTheDocument();
    });

    it("sends signed-out visitors to login", () => {
        (useAuth as Mock).mockReturnValue({ user: null, isLoading: false, logoutMutation: { mutate: vi.fn() } });
        render(<AdminLayout title="Users"><p>secret</p></AdminLayout>);
        expect(setLocation).toHaveBeenCalledWith("/login");
    });

    it("renders navigation, the back link and content for admins", () => {
        (useAuth as Mock).mockReturnValue({ user: { role: "admin" }, isLoading: false, logoutMutation: { mutate: vi.fn() } });
        render(<AdminLayout title="Users"><p>secret</p></AdminLayout>);

        expect(setLocation).not.toHaveBeenCalled();
        expect(screen.getByText("secret")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
        expect(screen.getByText("admin.layout.navigation.users").closest("a")).toHaveAttribute("aria-current", "page");
        expect(screen.getByText("admin.layout.backToApp").closest("a")).toHaveAttribute("href", "/dashboard");
    });
});
