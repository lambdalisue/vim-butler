import type { Denops } from "https://deno.land/x/denops_std@v3.12.1/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.12.1/function/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.12.1/buffer/mod.ts";

export function writableStreamFromVim(
  denops: Denops,
  winid: number,
  bufnr: number,
): WritableStream<string> {
  return new WritableStream({
    async write(chunk, _controller) {
      const remaining = (await fn.getbufline(denops, bufnr, "$")).join("\n");
      const newLines = chunk.split("\n");
      newLines[0] = remaining + newLines[0];
      await buffer.modifiable(denops, bufnr, async () => {
        await fn.setbufline(denops, bufnr, "$", newLines);
      });
      await fn.win_execute(denops, winid, "normal! G$");
    },
  });
}
