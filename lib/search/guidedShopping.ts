import type { NarrowOption, ParsedIntent } from "@/lib/search/types";

const INTRO = "根據你剛剛描述的需求，我先幫你整理幾個可能比較接近的方向。";

export function buildNarrowing(parsed: ParsedIntent, regenCount = 0): { intro: string; options: NarrowOption[] } {
  const base = parsed.baseQuery;
  const has = (x: string) => parsed.tags.includes(x);
  const alt = regenCount % 2 === 1;

  const primaryA = has("boss") ? (alt ? "偏成熟穩妥但不老派方向" : "偏穩重但不商務方向") : (alt ? "偏精緻體面送禮方向" : "偏質感送禮方向");
  const primaryB = has("casual") ? (alt ? "偏輕鬆有品味方向" : "偏輕鬆日常方向") : (alt ? "偏日常百搭質感方向" : "偏有質感但日常可用方向");
  const primaryC = has("safe") ? (alt ? "偏高接受度保守方向" : "偏大眾接受度高方向") : (alt ? "偏中性不出錯方向" : "偏不踩雷安全牌方向");

  const options: NarrowOption[] = [
    { id: "A", label: primaryA, description: alt ? "先抓有份量又不壓迫的禮物選項" : "先抓成熟有禮但不會太正式的選品", reason: "你提到送禮情境，先避開過度正式與距離感", searchQuery: `${base} 質感 禮物 實用` },
    { id: "B", label: primaryB, description: alt ? "以收禮者平常也會使用的品項優先" : "以好搭配、平常能用的品項為主", reason: "日常可用通常更容易被接受，也較不容易踩雷", searchQuery: `${base} 日常 實用 風格` },
    { id: "C", label: primaryC, description: alt ? "先從中性、品牌接受度高的方向下手" : "從中性、接受度高的品類開始", reason: "當收禮者偏好不明確時，安全牌成功率更高", searchQuery: `${base} 送禮 安全牌 熱門` },
    { id: "D", label: "重新整理方向", description: alt ? "已重整一次，如果還不像可再換條件" : "如果都不像，可以改描述或換條件重整", reason: "避免硬搜錯方向，先把需求說清楚會更快" }
  ];

  if (has("lightColor")) options[1] = { ...options[1], label: alt ? "偏淺色乾淨方向" : "偏淺色柔和方向", searchQuery: `${base} 淺色 柔和 送禮` };
  if (has("premium")) options[0] = { ...options[0], label: alt ? "偏高級材質細節方向" : "偏精緻送禮方向", searchQuery: `${base} 高級感 材質 禮盒` };

  return { intro: INTRO, options };
}
