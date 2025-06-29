export async function api<T>(path: string, req: RequestInit): Promise<T> {
    const response = await fetch(path, req);

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    return (await response.json()) as T;
}
