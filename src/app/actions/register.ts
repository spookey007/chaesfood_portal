"use server";

export type RegisterResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/** Public self-service registration is disabled; admins are provisioned separately. */
export async function registerUser(
  _prev: RegisterResult | undefined,
  _formData: FormData,
): Promise<RegisterResult> {
  return {
    ok: false,
    message:
      "Public sign-up is disabled. The storefront is open to guests; admin accounts are issued by an administrator.",
  };
}
