import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRpc,
  mockSendInquiryNotifications,
} = vi.hoisted(() => {
  return {
    mockRpc: vi.fn(),
    mockSendInquiryNotifications: vi.fn().mockResolvedValue({ admin: true, customer: true }),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/brevo/notify", () => ({
  sendInquiryNotifications: (...args: unknown[]) => mockSendInquiryNotifications(...args),
  INQUIRY_TYPE_LABELS: {
    product: "Product inquiry",
    service: "Service inquiry",
    custom_fabrication: "Custom fabrication requirement",
    general: "General question",
  },
}));

vi.mock("@/lib/data/public", () => ({
  getSettings: vi.fn().mockResolvedValue({
    company_name: "BAM",
    response_time_commitment: "Within 24 hours",
  }),
}));

vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}));

import { submitInquiry } from "@/app/actions/inquiry";
import { initialFormState } from "@/lib/validation/state";

function createValidFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    phone: "+971 50 123 4567",
    company: "Falcon Construction",
    type: "product",
    subject: "Steel Beam Inquiry",
    message: "We need custom steel beams for our project in Ajman.",
    privacy: "on",
    website: "", // honeypot
  };
  const data = { ...defaults, ...overrides };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      fd.append(k, v);
    }
  }
  return fd;
}

describe("Inquiry submission honeypot and validation (FIX 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({
      data: [{ id: "inq-123", reference: "BAM-2026-001", related_label: null }],
      error: null,
    });
  });

  it("an empty honeypot allows a valid inquiry to continue and complete successfully", async () => {
    const fd = createValidFormData({ website: "" });
    const result = await submitInquiry(initialFormState, fd);

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Thank you. Your inquiry has been received.");
    expect(result.reference).toBe("BAM-2026-001");

    expect(mockRpc).toHaveBeenCalledWith("submit_inquiry", expect.objectContaining({
      p_name: "Ahmed Hassan",
      p_email: "ahmed@example.com",
    }));
    expect(mockSendInquiryNotifications).toHaveBeenCalledTimes(1);
  });

  it("a populated honeypot returns the deceptive success response immediately", async () => {
    const fd = createValidFormData({ website: "https://spam-bot.example.com" });
    const result = await submitInquiry(initialFormState, fd);

    // Returns deceptive success
    expect(result.ok).toBe(true);
    expect(result.message).toBe("Thank you. Your inquiry has been received.");
    // Reference is not generated since DB was never called
    expect(result.reference).toBeUndefined();
  });

  it("a honeypot submission does not invoke submit_inquiry() in Supabase", async () => {
    const fd = createValidFormData({ website: "spambot" });
    await submitInquiry(initialFormState, fd);

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("a honeypot submission does not trigger administrator or customer email delivery", async () => {
    const fd = createValidFormData({ website: "spambot" });
    await submitInquiry(initialFormState, fd);

    expect(mockSendInquiryNotifications).not.toHaveBeenCalled();
  });

  it("a honeypot submission never reveals bot detection to the client", async () => {
    const fd = createValidFormData({
      website: "bot-url",
      email: "invalid-email-that-would-otherwise-fail",
      message: "short",
    });
    const result = await submitInquiry(initialFormState, fd);

    // Does not expose error or mention bot
    expect(result.ok).toBe(true);
    expect(result.errors).toBeUndefined();
    expect(result.message).toBe("Thank you. Your inquiry has been received.");
  });

  it("a legitimate inquiry still passes validation and follows normal submission path", async () => {
    const fd = createValidFormData({
      name: "Fatima Al Mansoori",
      email: "fatima@bammetaluae.com",
      phone: "+971 55 987 6543",
      type: "service",
      subject: "Custom CNC Cutting",
      message: "Looking for precision CNC laser cutting services for steel sheets.",
      website: "",
    });

    const result = await submitInquiry(initialFormState, fd);
    expect(result.ok).toBe(true);
    expect(result.reference).toBe("BAM-2026-001");
    expect(mockRpc).toHaveBeenCalledWith("submit_inquiry", expect.objectContaining({
      p_name: "Fatima Al Mansoori",
      p_type: "service",
    }));
    expect(mockSendInquiryNotifications).toHaveBeenCalledTimes(1);
  });

  it("invalid email addresses and missing required fields still fail validation for legitimate submissions", async () => {
    const badEmailFd = createValidFormData({ email: "notanemail", website: "" });
    const resEmail = await submitInquiry(initialFormState, badEmailFd);
    expect(resEmail.ok).toBe(false);
    expect(resEmail.errors?.email).toBeDefined();

    const missingNameFd = createValidFormData({ name: "", website: "" });
    const resName = await submitInquiry(initialFormState, missingNameFd);
    expect(resName.ok).toBe(false);
    expect(resName.errors?.name).toBeDefined();

    const unacknowledgedPrivacyFd = new FormData();
    unacknowledgedPrivacyFd.append("name", "Valid Name");
    unacknowledgedPrivacyFd.append("email", "valid@example.com");
    unacknowledgedPrivacyFd.append("phone", "+971 50 123 4567");
    unacknowledgedPrivacyFd.append("type", "general");
    unacknowledgedPrivacyFd.append("subject", "Valid Subject");
    unacknowledgedPrivacyFd.append("message", "This is a valid length message exceeding ten characters.");
    unacknowledgedPrivacyFd.append("website", "");
    // privacy checkbox omitted
    const resPrivacy = await submitInquiry(initialFormState, unacknowledgedPrivacyFd);
    expect(resPrivacy.ok).toBe(false);
    expect(resPrivacy.errors?.privacy).toBeDefined();
  });

  it("excessively long or malformed input remains rejected according to existing limits", async () => {
    const oversizedMessageFd = createValidFormData({
      message: "A".repeat(4001),
      website: "",
    });
    const resOversized = await submitInquiry(initialFormState, oversizedMessageFd);
    expect(resOversized.ok).toBe(false);
    expect(resOversized.errors?.message).toBeDefined();

    const invalidPhoneFd = createValidFormData({
      phone: "123", // too short (fewer than 7 digits)
      website: "",
    });
    const resPhone = await submitInquiry(initialFormState, invalidPhoneFd);
    expect(resPhone.ok).toBe(false);
    expect(resPhone.errors?.phone).toBeDefined();
  });
});
