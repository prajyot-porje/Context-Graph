export class AuthBodyTooLarge extends Error {}

export async function readAuthBody(
  request: Request,
  limit = 4096,
): Promise<unknown> {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new AuthBodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing body");
  const decoder = new TextDecoder();
  let size = 0,
    text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        // A cloned request tees the original stream. Awaiting cancellation can
        // wait forever for the unread sibling branch; close this branch now.
        void reader.cancel().catch(() => {});
        throw new AuthBodyTooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
