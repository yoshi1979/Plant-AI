import { describe, expect, it } from "vitest";
import { getSetupStatus } from "@/lib/setup-status";

describe("getSetupStatus", () => {
  it("returns a checklist", () => {
    const status = getSetupStatus();
    expect(status.total).toBeGreaterThan(5);
    expect(Array.isArray(status.checks)).toBe(true);
  });
});
