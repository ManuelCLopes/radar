import { describe, expect, it } from "vitest";
import { restoreApiPathFromRewrite } from "../vercel-api";

describe("restoreApiPathFromRewrite", () => {
  it("restores rewritten api paths back to the original express route", () => {
    expect(restoreApiPathFromRewrite("/api?path=google-places/status")).toBe(
      "/api/google-places/status",
    );
  });

  it("preserves additional query params after restoring the api path", () => {
    expect(restoreApiPathFromRewrite("/api?path=places/search&query=lisbon&radius=1000")).toBe(
      "/api/places/search?query=lisbon&radius=1000",
    );
  });

  it("keeps direct api requests unchanged when no rewrite param is present", () => {
    expect(restoreApiPathFromRewrite("/api/google-places/status")).toBe(
      "/api/google-places/status",
    );
  });

  it("normalizes a leading slash in the rewritten path", () => {
    expect(restoreApiPathFromRewrite("/api?path=%2Fcron%2Fcleanup-users")).toBe(
      "/api/cron/cleanup-users",
    );
  });
});
