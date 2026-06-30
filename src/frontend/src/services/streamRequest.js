import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

async function doStreamRequest(url, body, { onChunk, signal } = {}) {
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

export async function streamSseRequest(url, body, { onChunk, signal } = {}) {
  const response = await doStreamRequest(url, body, { onChunk, signal });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onChunk?.(text);
  }
}
