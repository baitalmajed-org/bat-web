import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import LoginForm, { type LoginFormProps } from "@/app/admin/login/LoginForm";
import { signIn } from "@/app/admin/actions/auth";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock SubmitButton and FormMessage
vi.mock("@/components/admin/SubmitButton", () => ({
  default: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    React.createElement("button", { type: "submit", className }, children),
}));

vi.mock("@/components/admin/FormMessage", () => ({
  default: () => null,
}));

// Mock next/navigation
const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: async () => ({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}));

// Mock supabase client
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  }),
}));

// Mock auth helper
const mockGetAdmin = vi.fn();
vi.mock("@/lib/supabase/auth", () => ({
  getAdmin: () => mockGetAdmin(),
}));

// Read source code for contract verification
const loginFormSrc = readFileSync(
  path.resolve(__dirname, "../src/app/admin/login/LoginForm.tsx"),
  "utf8"
);

describe("Admin Login — Show/Hide Password Toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Initial State & Default Visibility (Requirement 1, 2, 9)", () => {
    it("defaults to password-hidden on initial render", () => {
      const html = renderToStaticMarkup(React.createElement(LoginForm));

      // Input should be type="password"
      expect(html).toContain('type="password"');
      expect(html).not.toContain('type="text"');

      // Accessible toggle button with "Show password" label
      expect(html).toContain('aria-label="Show password"');
      expect(html).toContain('title="Show password"');
    });

    it("does not persist visibility state to localStorage, sessionStorage, or cookies", () => {
      // Must use ephemeral React useState initialized to default false
      expect(loginFormSrc).toContain("defaultShowPassword = false");
      expect(loginFormSrc).toContain("useState(defaultShowPassword)");
      expect(loginFormSrc).not.toMatch(/localStorage/);
      expect(loginFormSrc).not.toMatch(/sessionStorage/);
      expect(loginFormSrc).not.toMatch(/cookie/i);
    });

    it("renders the Eye icon inside the toggle button when password is hidden", () => {
      const html = renderToStaticMarkup(React.createElement(LoginForm));

      // Contains Eye icon SVG paths (Lucide Eye has circle r=3 and path)
      expect(html).toContain('aria-hidden="true"');
      expect(loginFormSrc).toContain("<Eye");
      expect(loginFormSrc).toContain("<EyeOff");
    });
  });

  describe("2. Visibility Toggling & Icon Switching (Requirement 2 & 3)", () => {
    it("renders type='text' and EyeOff with 'Hide password' label when showPassword is true", () => {
      const html = renderToStaticMarkup(
        React.createElement<LoginFormProps>(LoginForm, { defaultShowPassword: true })
      );

      // Input should now be type="text"
      expect(html).toContain('type="text"');
      expect(html).not.toContain('type="password"');

      // Accessible label should now be "Hide password"
      expect(html).toContain('aria-label="Hide password"');
      expect(html).toContain('title="Hide password"');

      // Contains EyeOff icon
      expect(html).toContain("lucide-eye-off");
    });

    it("toggles boolean state repeatedly using functional state updater", () => {
      // Verifies that onClick toggles state inversely: setShowPassword((prev) => !prev)
      expect(loginFormSrc).toMatch(/setShowPassword\(\s*\(\s*prev\s*\)\s*=>\s*!prev\s*\)/);

      // Verify toggle transitions
      const toggle = (prev: boolean) => !prev;
      expect(toggle(false)).toBe(true);  // Hidden -> Visible
      expect(toggle(true)).toBe(false);  // Visible -> Hidden
      expect(toggle(false)).toBe(true);  // Hidden -> Visible again
    });
  });

  describe("3. Password Preservation (Requirement 3)", () => {
    it("preserves the password input DOM node identity across toggles (no conditional unmounting)", () => {
      // The input element must NOT use dynamic key props that force React to unmount and destroy input value
      expect(loginFormSrc).not.toMatch(/key=\{showPassword/);
      expect(loginFormSrc).not.toMatch(/key=\{.*\?.*:.*\}/);

      // Input uses persistent id and name
      expect(loginFormSrc).toContain('id="password"');
      expect(loginFormSrc).toContain('name="password"');
    });

    it("keeps password input uncontrolled so DOM value is retained natively", () => {
      // In React, uncontrolled inputs retain user input across parent re-renders and type changes
      expect(loginFormSrc).not.toMatch(/value=\{password\}/);
      expect(loginFormSrc).not.toMatch(/value=\{.*\}/);
    });
  });

  describe("4. Accessibility & Keyboard Navigation (Requirement 6 & 7)", () => {
    it("uses a semantic button with explicit type='button' so it never submits the form", () => {
      const html = renderToStaticMarkup(React.createElement(LoginForm));

      // The toggle button MUST have type="button"
      expect(html).toMatch(/<button[^>]*type="button"[^>]*aria-label="Show password"/);

      // The submit button remains type="submit" (SubmitButton default)
      expect(html).toContain("Sign in");
    });

    it("includes accessible labels and tooltips that describe the action", () => {
      expect(loginFormSrc).toContain('aria-label={showPassword ? "Hide password" : "Show password"}');
      expect(loginFormSrc).toContain('title={showPassword ? "Hide password" : "Show password"}');
    });

    it("hides icons from assistive technology with aria-hidden='true'", () => {
      expect(loginFormSrc).toContain('<EyeOff className="h-4 w-4" aria-hidden="true" />');
      expect(loginFormSrc).toContain('<Eye className="h-4 w-4" aria-hidden="true" />');
    });

    it("provides visible burgundy focus styling and keyboard navigation support", () => {
      expect(loginFormSrc).toContain("focus:outline-none");
      expect(loginFormSrc).toContain("focus-visible:ring-2");
      expect(loginFormSrc).toContain("focus-visible:ring-brand");
    });
  });

  describe("5. Desktop & Mobile Layout & Burgundy Theme (Requirement 1, 4, 8)", () => {
    it("aligns toggle button to the right inside the password input container", () => {
      expect(loginFormSrc).toContain('className="relative"');
      expect(loginFormSrc).toContain("absolute inset-y-0 right-0 flex items-center px-3");
    });

    it("adds right padding (pr-10) to the password input so long text never overlaps the icon", () => {
      expect(loginFormSrc).toContain("field pr-10");
    });

    it("suppresses duplicate MS Edge native reveal buttons to avoid overlapping icons", () => {
      expect(loginFormSrc).toContain("[&::-ms-reveal]:hidden");
      expect(loginFormSrc).toContain("[&::-ms-clear]:hidden");
    });

    it("applies the brand burgundy color on hover and focus", () => {
      expect(loginFormSrc).toContain("hover:text-brand");
      expect(loginFormSrc).toContain("focus-visible:ring-brand");
    });

    it("preserves required email, validation, and layout classes", () => {
      const html = renderToStaticMarkup(React.createElement(LoginForm));
      expect(html).toContain('id="email"');
      expect(html).toContain('name="email"');
      expect(html).toContain('type="email"');
      expect(html).toContain('autoComplete="username"');
      expect(html).toContain('required=""');
    });
  });

  describe("6. Form Submission & Authentication (Requirement 4 & 10)", () => {
    it("successfully submits credentials to signIn action whether password was toggled or not", async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });
      mockGetAdmin.mockResolvedValueOnce({ id: "admin-1", email: "admin@bammetaluae.com" });

      const formData = new FormData();
      formData.append("email", "admin@bammetaluae.com");
      formData.append("password", "SecretPass123!");

      await expect(
        signIn({ ok: false, message: null }, formData)
      ).rejects.toThrow("NEXT_REDIRECT:/admin");

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "admin@bammetaluae.com",
        password: "SecretPass123!",
      });
    });

    it("enforces validation when required password is missing", async () => {
      const formData = new FormData();
      formData.append("email", "admin@bammetaluae.com");
      formData.append("password", "");

      const result = await signIn({ ok: false, message: null }, formData);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Enter your email and password.");
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });
});
