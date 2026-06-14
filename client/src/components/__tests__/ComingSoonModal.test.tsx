import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ComingSoonModal } from "../ComingSoonModal";

const mockToast = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({ user: { email: "owner@example.com" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({ toast: mockToast }),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe("ComingSoonModal", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        fetchMock.mockResolvedValue({ ok: true });
        vi.stubGlobal("fetch", fetchMock);
    });

    it("captures a Pro waitlist lead from the coming soon modal", async () => {
        const onOpenChange = vi.fn();

        render(<ComingSoonModal open onOpenChange={onOpenChange} />);

        fireEvent.change(screen.getByPlaceholderText("pricing.waitlist.messagePlaceholder"), {
            target: { value: "I want access for reports" },
        });
        fireEvent.click(screen.getByRole("button", { name: "pricing.waitlist.submit" }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith("/api/billing-waitlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "owner@example.com",
                    message: "I want access for reports",
                    plan: "pro",
                }),
            });
        });
        expect(mockToast).toHaveBeenCalledWith({
            title: "pricing.waitlist.successTitle",
            description: "pricing.waitlist.successDescription",
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
