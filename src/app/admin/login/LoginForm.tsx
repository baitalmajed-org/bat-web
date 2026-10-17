"use client";

import React, { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "../actions/auth";
import { initialFormState } from "@/lib/validation/state";
import SubmitButton from "@/components/admin/SubmitButton";
import FormMessage from "@/components/admin/FormMessage";

export interface LoginFormProps {
  defaultShowPassword?: boolean;
}

export default function LoginForm({
  defaultShowPassword = false,
}: LoginFormProps = {}) {
  const [state, action] = useActionState(signIn, initialFormState);
  const [showPassword, setShowPassword] = useState(defaultShowPassword);

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="field"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-steel-500 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 rounded transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <SubmitButton className="btn-primary w-full" pendingLabel="Signing in...">
        Sign in
      </SubmitButton>
    </form>
  );
}

