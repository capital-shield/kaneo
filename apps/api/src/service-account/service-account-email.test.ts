import { describe, expect, it } from "vite-plus/test";
import { serviceAccountEmail } from "./service-account-email";

describe("serviceAccountEmail", () => {
  it("builds a readable, unique address on the reserved domain", () => {
    expect(serviceAccountEmail("Sync Tool", "AbC123")).toBe(
      "sync-tool-abc123@service-account.invalid",
    );
  });

  it("drops characters that are not valid in a local part", () => {
    expect(serviceAccountEmail("  Café / Jira → Kaneo!  ", "id1")).toBe(
      "cafe-jira-kaneo-id1@service-account.invalid",
    );
  });

  it("falls back when the name has no usable characters", () => {
    expect(serviceAccountEmail("🤖", "id1")).toBe(
      "service-id1@service-account.invalid",
    );
  });
});
