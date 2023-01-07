import { assertEquals } from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { Client } from "./client.ts";
import { completions } from "./completions.ts";

const apiKey = Deno.env.get("OPENAI_API_KEY");
if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required to run tests",
  );
}
const client = new Client(apiKey);

Deno.test({
  name: "completions() properly returns the result of OpenAI completions API",
  fn: async () => {
    const resp = await completions(client, {
      model: "text-davinci-003",
      prompt: "Say this is a test",
      temperature: 0,
    });
    const data = await resp.json();
    assertEquals(data.choices[0].text, "\n\nThis is indeed a test.");
  },
  // Using completions API consume tokens so ignore unless user specify the envirnoment variable
  ignore: !Deno.env.get("ALLOW_OPENAI_COMPLETIONS_TESTS"),
});
