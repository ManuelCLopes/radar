import { describe, expect, it } from "vitest";
import { isDisplayableAddress } from "../location";

describe("isDisplayableAddress", () => {
  it("accepts a normal address", () => {
    expect(isDisplayableAddress("Rua de Belem 84-92, Lisboa")).toBe(true);
  });

  it("rejects coordinate strings", () => {
    expect(isDisplayableAddress("38.700000, -9.100000")).toBe(false);
  });

  it("rejects current location placeholders", () => {
    expect(isDisplayableAddress("Current Location")).toBe(false);
  });
});
