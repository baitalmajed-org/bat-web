export type FormState = {
  ok: boolean;
  message?: string;
  reference?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};
export const initialFormState: FormState = { ok: false };
