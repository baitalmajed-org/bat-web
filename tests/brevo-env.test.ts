import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { brevoConfig } from "@/lib/env";
import { isBrevoConfigured } from "@/lib/brevo/client";

describe("Brevo environment configuration and placeholder detection (FIX 4)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset to a known baseline where sender and admin emails are valid
    process.env.BREVO_API_KEY = "valid-secret-key-12345";
    process.env.BREVO_SENDER_EMAIL = "notifications@bammetaluae.com";
    process.env.BREVO_SENDER_NAME = "Bait Al Majed Metal Works";
    process.env.ADMIN_NOTIFICATION_EMAIL = "admin@bammetaluae.com";
  });

  afterEach(() => {
    // Restore original environment variables after each test
    process.env = { ...originalEnv };
  });

  it("1. Missing API key -> Unconfigured", () => {
    delete process.env.BREVO_API_KEY;
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("2. Empty API key -> Unconfigured", () => {
    process.env.BREVO_API_KEY = "";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("3. Whitespace-only key -> Unconfigured", () => {
    process.env.BREVO_API_KEY = "   \t  \n  ";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("4. 'your-brevo-api-key' placeholder -> Unconfigured", () => {
    process.env.BREVO_API_KEY = "your-brevo-api-key";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("5. An obvious 'your-...' template placeholder -> Unconfigured", () => {
    process.env.BREVO_API_KEY = "your-api-key-here";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);

    process.env.BREVO_API_KEY = "your_brevo_secret";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("6. Valid-looking non-placeholder key with valid sender and admin emails -> Configured", () => {
    process.env.BREVO_API_KEY = "xkeysib-9876543210fedcba";
    process.env.BREVO_SENDER_EMAIL = "sales@bammetaluae.com";
    process.env.ADMIN_NOTIFICATION_EMAIL = "director@bammetaluae.com";

    const cfg = brevoConfig();
    expect(cfg).not.toBeNull();
    expect(cfg?.apiKey).toBe("xkeysib-9876543210fedcba");
    expect(cfg?.senderEmail).toBe("sales@bammetaluae.com");
    expect(cfg?.adminEmail).toBe("director@bammetaluae.com");
    expect(isBrevoConfigured()).toBe(true);
  });

  it("7. Missing sender email -> Unconfigured", () => {
    delete process.env.BREVO_SENDER_EMAIL;
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("8. Invalid sender email -> Unconfigured", () => {
    process.env.BREVO_SENDER_EMAIL = "not-an-email";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);

    process.env.BREVO_SENDER_EMAIL = "sender@missing-tld";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("9. Missing admin notification email -> Unconfigured", () => {
    delete process.env.ADMIN_NOTIFICATION_EMAIL;
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });

  it("10. Invalid admin notification email -> Unconfigured", () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "invalid-admin-address";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);

    process.env.ADMIN_NOTIFICATION_EMAIL = "   ";
    expect(brevoConfig()).toBeNull();
    expect(isBrevoConfigured()).toBe(false);
  });
});
