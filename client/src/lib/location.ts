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

export async function fetchDisplayableAddressFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const response = await fetch("/api/places/reverse-geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const detectedAddress = typeof data.address === "string" ? data.address.trim() : "";

    return isDisplayableAddress(detectedAddress) ? detectedAddress : null;
  } catch {
    return null;
  }
}
