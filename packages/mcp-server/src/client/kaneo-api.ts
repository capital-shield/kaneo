export class KaneoApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async get(path: string): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
  }

  async post(path: string, body: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
  }

  async put(path: string, body: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
  }

  async delete(path: string, body?: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
}

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export async function toResult(res: Response): Promise<ToolResult> {
  const data: unknown = await res.json();
  if (!res.ok) {
    return {
      content: [
        { type: "text", text: `Error ${res.status}: ${JSON.stringify(data)}` },
      ],
      isError: true,
    };
  }
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
