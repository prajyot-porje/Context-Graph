import { SMTPServer } from "smtp-server";

export async function mailFixture(port = 0) {
  const emails = new Map<string, string>();
  let rejectDelivery = false;
  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ["AUTH", "STARTTLS"],
    logger: false,
    onData(stream, session, callback) {
      let raw = "";
      stream.on("data", (chunk) => {
        raw += chunk.toString();
      });
      stream.on("end", () => {
        if (rejectDelivery)
          return callback(
            Object.assign(new Error("Fixture rejection"), {
              responseCode: 550,
            }),
          );
        const code = raw.match(/code: (\d{6})/)?.[1];
        if (code)
          for (const recipient of session.envelope.rcptTo)
            emails.set(recipient.address, code);
        callback();
      });
      stream.on("error", callback);
    },
  });
  await new Promise<void>((resolve) =>
    server.listen(port, "127.0.0.1", resolve),
  );
  const address = server.server.address();
  if (!address || typeof address === "string")
    throw new Error("SMTP fixture failed to bind");
  return {
    emails,
    port: address.port,
    reject: (value: boolean) => {
      rejectDelivery = value;
    },
    close: () => new Promise<void>((resolve) => server.close(resolve)),
  };
}
