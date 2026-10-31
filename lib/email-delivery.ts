import { AsyncLocalStorage } from "node:async_hooks";

// Better Auth deliberately catches delivery callback errors. Track the result in
// this request's async scope so our public wrapper can report outages truthfully.
export const emailDelivery = new AsyncLocalStorage<{ failed: boolean }>();

export class EmailDeliveryError extends Error {
  constructor() {
    super("Email delivery is temporarily unavailable. Please try again later.");
    this.name = "EmailDeliveryError";
  }
}
