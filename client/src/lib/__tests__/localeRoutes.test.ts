import { describe, expect, it } from "vitest";
import { getRouteLocale, isLocalizedPublicPath, localizePath, stripLocalePrefix } from "../localeRoutes";

describe("localeRoutes", () => {
  it("detects the route locale from the /pt prefix", () => {
    expect(getRouteLocale("/")).toBe("en");
    expect(getRouteLocale("/pt")).toBe("pt");
    expect(getRouteLocale("/pt/")).toBe("pt");
    expect(getRouteLocale("/pt/competitor-tracker")).toBe("pt");
    expect(getRouteLocale("/ptx")).toBe("en");
    expect(getRouteLocale("/privacy-policy")).toBe("en");
  });

  it("strips the locale prefix", () => {
    expect(stripLocalePrefix("/pt")).toBe("/");
    expect(stripLocalePrefix("/pt/local-competitor-analysis")).toBe("/local-competitor-analysis");
    expect(stripLocalePrefix("/competitor-tracker/")).toBe("/competitor-tracker");
    expect(stripLocalePrefix("/competitor-tracker?ref=x")).toBe("/competitor-tracker");
  });

  it("localizes paths in both directions", () => {
    expect(localizePath("/", "pt")).toBe("/pt");
    expect(localizePath("/competitor-tracker", "pt")).toBe("/pt/competitor-tracker");
    expect(localizePath("/pt/competitor-tracker", "en")).toBe("/competitor-tracker");
    expect(localizePath("/pt", "en")).toBe("/");
    expect(localizePath("/pt/competitor-tracker", "pt")).toBe("/pt/competitor-tracker");
  });

  it("only treats the public marketing pages as localized", () => {
    expect(isLocalizedPublicPath("/")).toBe(true);
    expect(isLocalizedPublicPath("/pt/competitor-analysis-report")).toBe(true);
    expect(isLocalizedPublicPath("/dashboard")).toBe(false);
    expect(isLocalizedPublicPath("/pt/dashboard")).toBe(false);
  });
});
