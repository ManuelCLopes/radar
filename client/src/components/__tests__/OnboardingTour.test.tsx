import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingTour } from "../OnboardingTour";
import { splitLabel } from "../ReportContent";

const apiRequest = vi.fn().mockResolvedValue({ ok: true });

vi.mock("@/lib/queryClient", () => ({
    apiRequest: (...args: unknown[]) => apiRequest(...args),
    queryClient: { setQueryData: vi.fn() },
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

const newUser = { id: "u1", onboardingCompletedAt: null };

describe("OnboardingTour", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        apiRequest.mockClear();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    const advance = () => act(() => { vi.advanceTimersByTime(1000); });

    it("does not start while dashboard data is still loading", () => {
        render(<OnboardingTour user={newUser} dataReady={false} hasNoData />);
        advance();
        expect(screen.queryByText("onboarding.welcome.title")).toBeNull();
        expect(apiRequest).not.toHaveBeenCalled();
    });

    it("starts once for a new user and marks it as seen immediately", () => {
        render(<OnboardingTour user={newUser} dataReady hasNoData />);
        advance();
        expect(apiRequest).toHaveBeenCalledWith("POST", "/api/user/onboarding-complete");
        expect(localStorage.getItem("onboarding_completed:u1")).toBe("true");
    });

    it("never starts when the account already completed it", () => {
        render(<OnboardingTour user={{ id: "u1", onboardingCompletedAt: new Date() }} dataReady hasNoData />);
        advance();
        expect(screen.queryByText("onboarding.welcome.title")).toBeNull();
        expect(apiRequest).not.toHaveBeenCalled();
    });

    it("does not start for a returning user with data and records it as seen", () => {
        render(<OnboardingTour user={newUser} dataReady hasNoData={false} />);
        advance();
        expect(screen.queryByText("onboarding.welcome.title")).toBeNull();
        expect(apiRequest).toHaveBeenCalledWith("POST", "/api/user/onboarding-complete");
    });

    it("does not start when this device already saw it", () => {
        localStorage.setItem("onboarding_completed:u1", "true");
        render(<OnboardingTour user={newUser} dataReady hasNoData />);
        advance();
        expect(apiRequest).not.toHaveBeenCalled();
    });
});

describe("splitLabel", () => {
    it("splits a short label from its detail", () => {
        expect(splitLabel("Perfil Google Business: Atualizar horários")).toEqual({
            label: "Perfil Google Business",
            detail: "Atualizar horários",
        });
    });

    it("keeps plain text intact", () => {
        expect(splitLabel("Instagram")).toEqual({ label: null, detail: "Instagram" });
    });
});
