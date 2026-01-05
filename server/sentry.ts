import * as Sentry from "@sentry/node";

export function initSentry() {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            tracesSampleRate: 1.0,
        });
        console.log("Sentry initialized");
    } else {
        console.log("Sentry DSN not found, skipping initialization");
    }
}
