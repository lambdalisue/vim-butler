import type { Client } from "./client.ts";

// Note that the following interface is NOT complete.
// See more on official API reference.
// https://beta.openai.com/docs/api-reference/completions
export interface Params {
  model: string;
  prompt?: string | string[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  stop?: string | string[];
}

export type Choice = {
  text: string;
  index: number;
};

export function completions(
  client: Client,
  params: Params,
): Promise<Response> {
  return client.request("completions", {
    body: JSON.stringify(params),
  });
}

export class CompletionsStream extends TransformStream<string, string> {
  #prefix = "data: ";
  #index: number;

  constructor(index = 0) {
    super({
      transform: (chunk, controller) => this.#handle(chunk, controller),
    });
    this.#index = index;
  }

  #handle(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ): void {
    chunk = chunk.trim();
    if (!chunk.length) {
      return;
    }
    if (!chunk.startsWith(this.#prefix)) {
      controller.error(`The chunk is not expected format: ${chunk}`);
      return;
    }
    const data = chunk.substring(this.#prefix.length);
    if (data === "[DONE]") {
      controller.terminate();
      return;
    }
    const result = JSON.parse(data);
    const choice = result.choices[this.#index];
    controller.enqueue(choice.text);
  }
}
