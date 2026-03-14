// @vitest-environment node
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getAppBaseUrl, getGoogleCallbackUrl } from "../urls";

const originalEnv = process.env;

describe("URL helpers", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PUBLIC_APP_URL;
    delete process.env.APP_URL;
    delete process.env.BASE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    delete process.env.GOOGLE_CALLBACK_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("prefers PUBLIC_APP_URL for base URL", () => {
    process.env.PUBLIC_APP_URL = "https://radar.example.com/";

    expect(getAppBaseUrl()).toBe("https://radar.example.com");
  });

  it("derives the base URL from forwarded request headers when not configured", () => {
    const req = {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "app.example.com",
      },
      protocol: "http",
      get: () => "internal.example.com",
    } as any;

    expect(getAppBaseUrl(req)).toBe("https://app.example.com");
  });

  it("builds the Google callback URL from the public base URL", () => {
    process.env.PUBLIC_APP_URL = "https://radar.example.com";

    expect(getGoogleCallbackUrl()).toBe("https://radar.example.com/api/auth/google/callback");
  });

  it("ignores invalid configured base URLs", () => {
    process.env.PUBLIC_APP_URL = "/";

    expect(getAppBaseUrl()).toBe("http://localhost:5000");
  });

  it("resolves relative Google callback paths against the app base URL", () => {
    process.env.PUBLIC_APP_URL = "https://radar.example.com";
    process.env.GOOGLE_CALLBACK_URL = "/oauth/google/callback";

    expect(getGoogleCallbackUrl()).toBe("https://radar.example.com/oauth/google/callback");
  });
});
