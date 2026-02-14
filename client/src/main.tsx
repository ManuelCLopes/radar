import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import { COOKIE_CONSENT_EVENT, getCookieConsent } from "@/lib/consent";
import type { Integration } from "@sentry/core";

const shouldInitSentry = () => {
    if (!import.meta.env.VITE_SENTRY_DSN) return false;
    if (typeof window === "undefined") return false;
    const dnt = navigator.doNotTrack === "1" || (window as any).doNotTrack === "1";
    if (dnt) return false;
    return getCookieConsent() === "accepted";
};

let sentryInitialized = false;

const initSentry = () => {
    if (sentryInitialized) return;
    if (!import.meta.env.VITE_SENTRY_DSN) return;

    const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.1");
    const replaysSessionSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE ?? "0");
    const replaysOnErrorSampleRate = Number(import.meta.env.VITE_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE ?? "0");

    const integrations: Integration[] = [Sentry.browserTracingIntegration()];
    if (replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0) {
        integrations.push(
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            })
        );
    }

    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations,
        tracesSampleRate,
        replaysSessionSampleRate,
        replaysOnErrorSampleRate,
        sendDefaultPii: false,
    });

    sentryInitialized = true;
};

if (shouldInitSentry()) {
    initSentry();
}

if (typeof window !== "undefined") {
    window.addEventListener(COOKIE_CONSENT_EVENT, (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (detail === "accepted") {
            initSentry();
        }
        if (detail === "declined" && sentryInitialized) {
            Sentry.close();
            sentryInitialized = false;
        }
    });
}


createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);
