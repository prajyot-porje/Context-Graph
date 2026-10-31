/** Decode only the bounded test-email source supplied by the read-only IMAP check. */
export function extractTestCode(source: string): string | undefined {
  const quoted = source
    .replace(/=\r?\n/g, "")
    .replace(/=([a-f0-9]{2})/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
  const plain = quoted.match(/code: (\d{6})/)?.[1];
  if (plain) return plain;
  for (const part of source.split(/\r?\n--/)) {
    const separator = part.search(/\r?\n\r?\n/);
    if (
      separator < 0 ||
      !/Content-Transfer-Encoding:\s*base64/i.test(part.slice(0, separator))
    )
      continue;
    const decoded = Buffer.from(
      part.slice(separator).trim(),
      "base64",
    ).toString("utf8");
    const code = decoded.match(/code: (\d{6})/)?.[1];
    if (code) return code;
  }
}
