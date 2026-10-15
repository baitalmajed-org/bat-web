"use client";

import { useActionState } from "react";
import { signIn } from "../actions/auth";
import { initialFormState } from "@/lib/validation/state";
import SubmitButton from "@/components/admin/SubmitButton";
import FormMessage from "@/components/admin/FormMessage";

export default function LoginForm() {
  const [state, action] = useActionState(signIn, initialFormState);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="field" /></div>
      <div><label htmlFor="password" className="label">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
      <SubmitButton className="btn-primary w-full" pendingLabel="Signing in...">Sign in</SubmitButton>
    </form>
  );
}
