import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { Client } from "./client.ts";

const apiKey = Deno.env.get("OPENAI_API_KEY");
if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required to run tests",
  );
}
const client = new Client(apiKey);

Deno.test("Client.request() properly returns the result of OpenAI moderations API", async () => {
  const resp = await client.request("moderations", {
    body: JSON.stringify({
      input: "I am violence!",
    }),
  });
  assertEquals(resp.status, 200);
  await resp.body?.cancel();
});
