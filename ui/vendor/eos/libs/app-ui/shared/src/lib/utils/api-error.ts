type ErrorLike = {
  status?: number;
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeDetail = (detail: unknown): string | null => {
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (isRecord(item) && typeof item['msg'] === 'string')
          return item['msg'];
        return null;
      })
      .filter((item): item is string => Boolean(item));
    return parts.length ? parts.join(', ') : null;
  }

  if (isRecord(detail) && typeof detail['message'] === 'string') {
    return detail['message'];
  }

  if (isRecord(detail) && 'detail' in detail) {
    return normalizeDetail(detail['detail']);
  }

  return null;
};

export const getApiErrorStatus = (error: unknown): number | undefined => {
  if (!isRecord(error)) {
    return undefined;
  }

  const typedError = error as ErrorLike;
  if (typeof typedError.status === 'number') {
    return typedError.status;
  }

  if (typeof typedError.response?.status === 'number') {
    return typedError.response.status;
  }

  return undefined;
};

export const isApiErrorStatus = (error: unknown, status: number): boolean =>
  getApiErrorStatus(error) === status;

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (isRecord(error)) {
    const detail =
      normalizeDetail(error['detail']) ||
      normalizeDetail(error['message']) ||
      normalizeDetail(error['error']) ||
      normalizeDetail(error['data']) ||
      normalizeDetail((error as ErrorLike).response?.data);

    if (detail) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const getResponseErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const payload: unknown = await response.clone().json();
    if (isRecord(payload)) {
      const detail =
        normalizeDetail(payload['detail']) ||
        normalizeDetail(payload['message']) ||
        normalizeDetail(payload['error']);
      if (detail) {
        return detail;
      }
    }
  } catch {
    try {
      const text = (await response.clone().text()).trim();
      if (text) {
        return text;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
};
