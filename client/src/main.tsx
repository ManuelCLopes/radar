import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
    });
}


createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
        <App />
    </HelmetProvider>
);
