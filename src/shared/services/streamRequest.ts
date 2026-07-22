import { API_BASE_URL } from '@shared/config';
import { makeId } from '@shared/utils/id';
import { cookieRefresh } from '@shared/services/cookieRefresh';
import { t } from '@shared/i18n/useTranslation';

const BASE_URL = API_BASE_URL;

export interface StreamAuth {
  getToken?: () => string | null | undefined;
  refreshToken?: () => Promise<void>;
  withCredentials?: boolean;
}

export interface StreamOptions extends StreamAuth {
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
  idleTimeoutMs?: number;
}

const DEFAULT_IDLE_TIMEOUT_MS = 60_000;

function buildInit(
  body: unknown,
  auth: StreamAuth,
  signal?: AbortSignal,
): RequestInit {
  const withCredentials = auth.withCredentials ?? true;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': makeId(),
  };
  const token = auth.getToken?.();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const init: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  };
  if (withCredentials) init.credentials = 'include';
  return init;
}

async function doStreamRequest(
  url: string,
  body: unknown,
  { signal, getToken, refreshToken, withCredentials }: StreamOptions = {},
): Promise<Response> {
  const auth: StreamAuth = {
    ...(getToken ? { getToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
    ...(withCredentials !== undefined ? { withCredentials } : {}),
  };
  const response = await fetch(url, buildInit(body, auth, signal));

  if (response.status === 401) {
    const refresh = refreshToken ?? (() => cookieRefresh(BASE_URL, '/refresh'));
    await refresh();

    const retryResponse = await fetch(url, buildInit(body, auth, signal));
    if (!retryResponse.ok || !retryResponse.body) {
      throw new Error(t('common.errors.requestFailed', { status: retryResponse.status }));
    }
    return retryResponse;
  }

  if (!response.ok || !response.body) {
    throw new Error(t('common.errors.requestFailed', { status: response.status }));
  }
  return response;
}

export async function streamSseRequest(
  url: string,
  body: unknown,
  options: StreamOptions = {},
): Promise<void> {
  const { onChunk, idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS } = options;
  const response = await doStreamRequest(url, body, options);
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  const readChunk =
    async (): Promise<ReadableStreamReadResult<Uint8Array>> => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const idle = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(t('common.errors.timeout')));
        }, idleTimeoutMs);
      });
      try {
        return await Promise.race([reader.read(), idle]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
  try {
    for (
      let result = await readChunk();
      !result.done;
      result = await readChunk()
    ) {
      const text = decoder.decode(result.value, { stream: true });
      if (text) onChunk?.(text);
    }
  } catch (err) {
    await reader.cancel().catch(() => undefined);
    throw err;
  }
}
