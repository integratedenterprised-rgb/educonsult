"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/auth";

export async function signInAction(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.type === "CredentialsSignin" ? "Invalid email or password" : "Sign-in failed" };
    }
    return { error: "Sign-in failed" };
  }
}
