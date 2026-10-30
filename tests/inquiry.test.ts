import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc } = vi.hoisted(() => {
  return {
    mockRpc: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue(true),
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
    name: "Ahmed Al Nuaimi",
    email: "ahmed@example.com",
    phone: "+971 50 123 4567",
    company: "Ajman Industrial Supplies",
    type: "general",
    subject: "Steel Beam Fabrication Query",
    message: "We need 50 pieces of custom I-beams cut and drilled to specific dimensions.",
    privacy: "on",
    website: "", // honeypot
    ...overrides,
  };

  for (const [k, v] of Object.entries(defaults)) {
    if (v !== undefined) {
      fd.append(k, v);
    }
  }
  return fd;
}

describe("submitInquiry honeypot and real submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("honeypot website field filled -> returns success message immediately without DB insert", async () => {
    const fd = createValidFormData({
      website: "http://bot-spam.example.com",
    });

    const result = await submitInquiry(initialFormState, fd);

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Thank you. Your inquiry has been received.");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("honeypot website filled with only whitespace -> trimmed and silently accepted without DB call", async () => {
    const fd = createValidFormData({
      website: "   https://spambot.net   ",
    });

    const result = await submitInquiry(initialFormState, fd);
        expect(result.ok).toBe(true);
    expect(result.message).toBe("Thank you. Your inquiry has been received.");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("clean submission with website empty -> calls submit_inquiry RPC", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ id: "inq-123", reference: "BAM-261029-ABC123", related_label: null }],
      error: null,
    });

    const fd = createValidFormData({
      website: "",
    });

    const result = await submitInquiry(initialFormState, fd);
        expect(result.ok).toBe(true);
    expect(result.reference).toBe("BAM-261029-ABC123");
    expect(result.message).toBe("Thank you. Your inquiry has been received.");
    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("submit_inquiry", {
      p_name: "Ahmed Al Nuaimi",
      p_email: "ahmed@example.com",
      p_phone: "+971 50 123 4567",
      p_company: "Ajman Industrial Supplies",
      p_type: "general",
      p_product_id: null,
      p_service_id: null,
      p_subject: "Steel Beam Fabrication Query",
      p_message: "We need 50 pieces of custom I-beams cut and drilled to specific dimensions.",
    });
  });

  it("clean submission for service inquiry -> correctly passes serviceId to RPC", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ id: "inq-456", reference: "BAM-2026-001", related_label: "Laser Cutting" }],
      error: null,
    });

    const fd = createValidFormData({
      name: "Fatima Al Mansoori",
      email: "fatima@contracting.ae",
      phone: "+971 55 987 6543",
      type: "service",
      serviceId: "11111111-2222-3333-4444-555555555555",
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
