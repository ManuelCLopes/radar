const coordinateAddressPattern = /^-?\d{1,3}(?:\.\d+)?,\s*-?\d{1,3}(?:\.\d+)?$/;

export function isDisplayableAddress(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (/^current location/i.test(trimmed)) {
    return false;
  }

  return !coordinateAddressPattern.test(trimmed);
}
