export class OpenAICompletionsStream extends TransformStream<string, string> {
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
