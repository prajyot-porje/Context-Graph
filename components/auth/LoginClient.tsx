"use client";
import { AuthForm } from "./AuthForm";
export default function LoginClient(props: {
  destination?: string;
  googleEnabled?: boolean;
  initialEmail?: string;
  oauthError?: boolean;
}) {
  return <AuthForm mode="login" {...props} />;
}
