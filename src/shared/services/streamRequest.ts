import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export interface StreamOptions {
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

async function doStreamRequest(
  url: string,
  body: unknown,
  { signal }: StreamOptions = {},
): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });

  if (response.status === 401) {
    await axios.post(`${BASE_URL}/refresh`, {}, { withCredentials: true });

    const retryResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal,
    });
    if (!retryResponse.ok || !retryResponse.body) {
      throw new Error(`Ошибка ${retryResponse.status}`);
    }
    return retryResponse;
  }

  if (!response.ok || !response.body) {
    throw new Error(`Ошибка ${response.status}`);
  }
  return response;
}

export async function streamSseRequest(
  url: string,
  body: unknown,
  { onChunk, signal }: StreamOptions = {},
): Promise<void> {
  const response = await doStreamRequest(url, body, { onChunk, signal });
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onChunk?.(text);
  }
}
