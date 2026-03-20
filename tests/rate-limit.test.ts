import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/services/rate-limit";

describe("checkRateLimit", () => {
  it("blocks after max requests within the window", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 60000, 2).allowed).toBe(true);
    expect(checkRateLimit(key, 60000, 2).allowed).toBe(true);
    expect(checkRateLimit(key, 60000, 2).allowed).toBe(false);
  });
});
