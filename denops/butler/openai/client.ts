const apiBaseUrl = "https://api.openai.com/v1";

export class Client {
  #apiKey: string;
  #organization: string;

  constructor(apiKey: string, organization?: string) {
    this.#apiKey = apiKey;
    this.#organization = organization ?? "";
  }

  async request(
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    init.method = init.method ?? "POST";
    init.headers = new Headers(init.headers);
    init.headers.set("Authorization", `Bearer ${this.#apiKey}`);
    if (this.#organization) {
      init.headers.set("OpenAI-Organization", this.#organization);
    }
    if (!init.headers.has("Content-Type")) {
      init.headers.set("Content-Type", "application/json");
    }
    const resp = await fetch(`${apiBaseUrl}/${path}`, init);
    if (resp.status !== 200) {
      let detail: string;
      try {
        detail = `\n${await resp.text()}`;
      } catch {
        detail = "";
      }
      throw new Error(
        `HTTP error: ${resp.status} ${resp.statusText}${detail}`,
      );
    }
    return resp;
  }
}

export function getClient(): Client | undefined {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.warn("OPENAI_API_KEY environment variable is required");
    return;
  }
  return new Client(apiKey);
}
