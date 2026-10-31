import { CheckCircle2, Circle, CircleAlert } from "lucide-react";
import s from "./SetupClient.module.css";
export function ConnectionState({
  name,
  connected,
  error,
}: {
  name: string;
  connected: boolean;
  error?: boolean;
}) {
  return (
    <span
      role="status"
      className={`${s.connectionState} ${error ? s.connectionFailed : connected ? s.connectionReady : ""}`}
    >
      {error ? (
        <CircleAlert size={18} />
      ) : connected ? (
        <CheckCircle2 size={18} />
      ) : (
        <Circle size={18} />
      )}{" "}
      {error
        ? "Status check failed"
        : `${name} ${connected ? "connected" : "not connected yet"}`}
    </span>
  );
}
