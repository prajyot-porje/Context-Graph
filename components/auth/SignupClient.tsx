"use client";
import { AuthForm } from "./AuthForm";
export default function SignupClient(props: {
  destination?: string;
  googleEnabled?: boolean;
  initialEmail?: string;
}) {
  return <AuthForm mode="signup" {...props} />;
}
