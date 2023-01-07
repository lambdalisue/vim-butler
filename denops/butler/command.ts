import type { Denops } from "https://deno.land/x/denops_std@v3.12.1/mod.ts";
import { TextLineStream } from "https://deno.land/std@0.171.0/streams/text_line_stream.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.12.1/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.12.1/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.12.1/buffer/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.12.1/variable/mod.ts";
import { getClient } from "./openai/client.ts";
import { completions } from "./openai/completions.ts";
import { OpenAICompletionsStream } from "./stream/openai_completions_stream.ts";
import { writableStreamFromVim } from "./stream/writable_stream_from_vim.ts";

let contextCache: string | undefined;

export async function command(
  denops: Denops,
  winid: number,
  bufnr: number,
  callbackId: string,
): Promise<void> {
  const client = getClient();
  if (!client) {
    return;
  }
  const [content, modifiable, model, max_tokens, temperature] = await batch
    .gather(denops, async (denops) => {
      await fn.getbufline(denops, bufnr, 1, "$");
      await fn.getbufvar(denops, bufnr, "&modifiable");
      await vars.g.get(denops, "butler_openai_model");
      await vars.g.get(denops, "butler_openai_max_tokens");
      await vars.g.get(denops, "butler_openai_temperature");
    }) as [string[], number, unknown, unknown, unknown];
  if (!unknownutil.isString(model)) {
    throw new Error(
      `g:butler_openai_model must be string value but '${model}' is specified`,
    );
  }
  if (!unknownutil.isNumber(max_tokens)) {
    throw new Error(
      `g:butler_openai_max_tokens must be number value but '${max_tokens}' is specified`,
    );
  }
  if (!unknownutil.isNumber(temperature)) {
    throw new Error(
      `g:butler_openai_temperature must be number value but '${temperature}' is specified`,
    );
  }
  const context = await getContext();
  const resp = await completions(client, {
    model,
    prompt: `${context}\n${content.join("\n")}`,
    max_tokens,
    temperature,
    stream: true,
  });
  await fn.setbufvar(denops, bufnr, "&modifiable", 0);
  try {
    await resp.body!
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(new OpenAICompletionsStream())
      .pipeTo(writableStreamFromVim(denops, winid, bufnr));
  } finally {
    await fn.setbufvar(denops, bufnr, "&modifiable", modifiable);
  }
  // Place signs
  const start = content.length + 1;
  const end = await getLineCount(denops, bufnr);
  await batch.batch(denops, async (denops) => {
    for (let i = start; i <= end; i++) {
      await denops.cmd(
        `sign place ${i} line=${i} name=butlerResponseLine buffer=${bufnr}`,
      );
    }
  });
  // Add mergin and move cursor
  await buffer.modifiable(denops, bufnr, async () => {
    await fn.appendbufline(denops, bufnr, "$", ["", ""]);
    await fn.win_execute(denops, winid, "normal! G$");
  });
  // Callback
  await denops.call("denops#callback#call", callbackId, winid, bufnr);
}

async function getContext(): Promise<string> {
  if (contextCache) {
    return contextCache;
  }
  const resp = await fetch(new URL("./context.md", import.meta.url));
  contextCache = await resp.text();
  return contextCache;
}

async function getLineCount(denops: Denops, bufnr: number): Promise<number> {
  const bufinfos = await fn.getbufinfo(denops, bufnr) as {
    linecount: number;
  }[];
  if (!bufinfos.length) {
    throw new Error(`No buffer ${bufnr} exists`);
  }
  return bufinfos[0].linecount;
}
