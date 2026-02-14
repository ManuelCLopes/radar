export const COOKIE_CONSENT_KEY = "cookie-consent";
export const COOKIE_CONSENT_UPDATED_AT_KEY = "cookie-consent-updated-at";
export const COOKIE_CONSENT_EVENT = "cookie-consent-updated";

export type CookieConsentValue = "accepted" | "declined" | "unset";

export function getCookieConsent(): CookieConsentValue {
  if (typeof window === "undefined") return "unset";
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "declined") {
    return value;
  }
  return "unset";
}

export function setCookieConsent(value: Exclude<CookieConsentValue, "unset">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  localStorage.setItem(COOKIE_CONSENT_UPDATED_AT_KEY, new Date().toISOString());
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}

export function resetCookieConsent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_CONSENT_UPDATED_AT_KEY);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: "unset" }));
}
