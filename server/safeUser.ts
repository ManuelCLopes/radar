// Fields that must never leave the server: credentials, verification secrets
// and billing identifiers.
const SENSITIVE_USER_FIELDS = [
    "passwordHash",
    "verificationToken",
    "verificationTokenExpiresAt",
    "stripeCustomerId",
    "stripeSubscriptionId",
] as const;

export type SafeUser<T> = Omit<T, typeof SENSITIVE_USER_FIELDS[number]>;

export function toSafeUser<T extends Record<string, any>>(user: T): SafeUser<T> {
    const safe: Record<string, any> = { ...user };
    for (const field of SENSITIVE_USER_FIELDS) delete safe[field];
    return safe as SafeUser<T>;
}
