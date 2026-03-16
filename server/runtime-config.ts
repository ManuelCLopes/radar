const splitCsv = (value?: string | null) =>
  value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

export const isProductionEnvironment = () => process.env.NODE_ENV === "production";

export const getAllowedOrigins = () => splitCsv(process.env.ALLOWED_ORIGINS);

export function assertSecureProductionRuntimeConfig() {
  if (!isProductionEnvironment()) {
    return;
  }

  const missing: string[] = [];

  if (!process.env.SESSION_SECRET?.trim()) {
    missing.push("SESSION_SECRET");
  }

  if (!process.env.DATABASE_URL?.trim()) {
    missing.push("DATABASE_URL");
  }

  if (getAllowedOrigins().length === 0) {
    missing.push("ALLOWED_ORIGINS");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required production configuration: ${missing.join(", ")}`,
    );
  }
}
