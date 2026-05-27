import OpenAI from "openai";
import type { ParsedIntent, ParserSource } from "@/lib/search/types";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function parseIntent(input: string): Promise<{ parsed: ParsedIntent; parserSource: ParserSource; errorMessage?: string }> {
  if (!client) return { parsed: { baseQuery: input, tags: detectTags(input) }, parserSource: "fallback", errorMessage: "OPENAI_API_KEY missing" };
  try {
    const rsp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `萃取購物語境標籤，回傳 JSON: {baseQuery:string,tags:string[]}。輸入: ${input}`
    });
    const text = rsp.output_text || "";
    const parsed = JSON.parse(text) as ParsedIntent;
    return { parsed: { baseQuery: parsed.baseQuery || input, tags: parsed.tags?.length ? parsed.tags : detectTags(input) }, parserSource: "openai" };
  } catch (e) {
    return { parsed: { baseQuery: input, tags: detectTags(input) }, parserSource: "fallback", errorMessage: e instanceof Error ? e.message : "parse failed" };
  }
}

function detectTags(t: string): string[] {
  const s = t.toLowerCase();
  const tags: string[] = [];
  if (/送禮|生日|老婆|女友|gift/.test(s)) tags.push("gift");
  if (/主管|老闆|長官/.test(s)) tags.push("boss");
  if (/不要太商務|不商務|不要正式|不正式/.test(s)) tags.push("casual");
  if (/不喜歡深色|不要黑|不要暗色/.test(s)) tags.push("lightColor");
  if (/不知道品牌|不知道買什麼/.test(s)) tags.push("safe");
  if (/高級感|質感/.test(s)) tags.push("premium");
  return tags;
}
