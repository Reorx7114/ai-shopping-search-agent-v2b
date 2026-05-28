import OpenAI from "openai";
import type { ParsedIntent, ParserSource, SemanticContext } from "@/lib/search/types";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const UNKNOWN: SemanticContext = {
  recipientGender: "unknown",
  recipientAgeGroup: "unknown",
  relationship: "unknown",
  socialPosition: "unknown",
  occasion: "unknown",
  personality: ["unknown"],
  productCategory: "unknown",
  negativePreferences: [],
  emotionalTone: []
};

function extractSemanticContext(input: string): SemanticContext {
  const s = input.toLowerCase();
  const negatives = [...input.matchAll(/不(?:要|想|喜歡)?([^，。,\n]+)/g)].map((m) => `不要${m[1].trim()}`);
  const ctx: SemanticContext = { ...UNKNOWN, personality: [], negativePreferences: negatives };

  if (/老婆|太太|妻子|伴侶|女友/.test(s)) { ctx.relationship = /老婆|太太|妻子/.test(s) ? "spouse" : "partner"; ctx.recipientGender = "female"; }
  if (/爸爸|父親|老爸/.test(s)) { ctx.relationship = "parent"; ctx.recipientGender = "male"; ctx.socialPosition = "elder"; }
  if (/主管|老闆|長官/.test(s)) { ctx.relationship = "supervisor"; ctx.socialPosition = "supervisor"; }
  if (/小朋友|小女生|女孩|兒童/.test(s)) { ctx.recipientAgeGroup = "child"; if (/小女生|女孩/.test(s)) ctx.recipientGender = "female"; }
  if (/幼兒/.test(s)) ctx.recipientAgeGroup = "toddler";
  if (/長輩|阿公|爺爺|奶奶/.test(s)) { ctx.recipientAgeGroup = "senior"; ctx.socialPosition = "elder"; }

  if (/生日/.test(s)) ctx.occasion = "birthday";
  else if (/週年|紀念日/.test(s)) ctx.occasion = "anniversary";
  else if (/送禮|禮物/.test(s)) ctx.occasion = ctx.socialPosition === "supervisor" ? "workplace_gift" : "casual_gift";

  if (/玩具|toy/.test(s)) ctx.productCategory = "toy";
  else if (/包包|背包/.test(s)) ctx.productCategory = "bag";
  else if (/香水|香氛/.test(s)) ctx.productCategory = "fragrance";
  else if (/保養/.test(s)) ctx.productCategory = "skincare";
  else if (/美妝|化妝/.test(s)) ctx.productCategory = "beauty";
  else if (/配件|飾品/.test(s)) ctx.productCategory = "accessory";
  else if (/家居|家用/.test(s)) ctx.productCategory = "home";
  else if (/3c|耳機|鍵盤|科技/.test(s)) ctx.productCategory = "tech";

  if (/頑固|嚴謹/.test(s)) ctx.personality.push("strict", "conservative");
  if (/實用/.test(s)) ctx.personality.push("practical");
  if (/低調|不要浮誇|不喜歡奢華|不要奢華/.test(s)) ctx.personality.push("low_key");
  if (/可愛|活潑/.test(s)) ctx.personality.push("playful");

  const tone = new Set<SemanticContext["emotionalTone"][number]>();
  if (ctx.recipientAgeGroup === "child") tone.add("cute"), tone.add("playful"), tone.add("creative");
  if (ctx.relationship === "spouse" || ctx.relationship === "partner") tone.add("thoughtful"), tone.add("warm");
  if (ctx.personality.includes("low_key")) tone.add("low_key"), tone.add("elegant");
  if (ctx.personality.includes("strict") || ctx.relationship === "parent") tone.add("practical"), tone.add("safe");
  ctx.emotionalTone = [...tone];
  if (ctx.personality.length === 0) ctx.personality = ["unknown"];
  return ctx;
}

function detectTags(t: string): string[] {
  const s = t.toLowerCase();
  const tags: string[] = [];
  if (/送禮|生日|gift/.test(s)) tags.push("gift");
  if (/主管|老闆|長官/.test(s)) tags.push("boss");
  if (/不要太商務|不商務|不要正式|不正式/.test(s)) tags.push("casual");
  if (/不喜歡深色|不要黑|不要暗色/.test(s)) tags.push("lightColor");
  if (/不知道品牌|不知道買什麼/.test(s)) tags.push("safe");
  if (/高級感|質感/.test(s)) tags.push("premium");
  return tags;
}

export async function parseIntent(input: string): Promise<{ parsed: ParsedIntent; parserSource: ParserSource; errorMessage?: string }> {
  const fallback = { baseQuery: input, tags: detectTags(input), semanticContext: extractSemanticContext(input) };
  if (!client) return { parsed: fallback, parserSource: "fallback", errorMessage: "OPENAI_API_KEY missing" };
  try {
    const rsp = await client.responses.create({ model: "gpt-4.1-mini", input: `萃取購物語境，回傳 JSON {baseQuery:string,tags:string[]}。輸入:${input}` });
    const parsed = JSON.parse(rsp.output_text || "{}") as { baseQuery?: string; tags?: string[] };
    return { parsed: { baseQuery: parsed.baseQuery || input, tags: parsed.tags?.length ? parsed.tags : fallback.tags, semanticContext: fallback.semanticContext }, parserSource: "openai" };
  } catch (e) {
    return { parsed: fallback, parserSource: "fallback", errorMessage: e instanceof Error ? e.message : "parse failed" };
  }
}
