import type { Denops } from "https://deno.land/x/denops_std@v3.12.1/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import { command } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    command: (winid, bufnr, callbackId) => {
      unknownutil.assertNumber(winid);
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(callbackId);
      return command(denops, winid, bufnr, callbackId);
    },
  };
}
