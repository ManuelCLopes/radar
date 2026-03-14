import type { Request } from "express";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeUrl(value: string): string {
  if (value.startsWith("/")) {
    throw new Error("Base URL candidates must be absolute URLs or hosts");
  }

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(normalized);

  if (!url.hostname) {
    throw new Error("Base URL candidates must include a hostname");
  }

  return stripTrailingSlash(url.toString());
}

function getConfiguredBaseUrl(): string | null {
  const candidates = [
    process.env.PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      try {
        return normalizeUrl(candidate.trim());
      } catch {
        continue;
      }
    }
  }

  return null;
}

export function getAppBaseUrl(req?: Request): string {
  const configuredUrl = getConfiguredBaseUrl();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (!req) {
    return "http://localhost:5000";
  }

  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const protocol =
    typeof forwardedProto === "string" ? forwardedProto.split(",")[0] : req.protocol;
  const host =
    typeof forwardedHost === "string" ? forwardedHost.split(",")[0] : req.get("host");

  if (!host) {
    return "http://localhost:5000";
  }

  return `${protocol}://${host}`;
}

export function getGoogleCallbackUrl(req?: Request): string {
  const explicitCallback = process.env.GOOGLE_CALLBACK_URL;
  if (explicitCallback && explicitCallback.trim()) {
    const trimmedCallback = explicitCallback.trim();
    if (/^https?:\/\//i.test(trimmedCallback)) {
      return stripTrailingSlash(trimmedCallback);
    }

    return `${getAppBaseUrl(req)}${trimmedCallback.startsWith("/") ? trimmedCallback : `/${trimmedCallback}`}`;
  }

  return `${getAppBaseUrl(req)}/api/auth/google/callback`;
}
