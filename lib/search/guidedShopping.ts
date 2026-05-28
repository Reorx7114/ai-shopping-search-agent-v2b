import type { NarrowOption, ParsedIntent, SemanticContext } from "@/lib/search/types";

const INTRO = "根據你剛剛描述的需求，我先幫你整理幾個可能比較接近的方向。";

function buildDirectionSet(ctx: SemanticContext, alt: boolean): Array<{ label: string; desc: string; reason: string; k: string[] }> {
  if (ctx.recipientAgeGroup === "child" && ctx.productCategory === "toy") {
    return [
      { label: alt ? "偏安全耐玩方向" : "偏可愛陪伴感方向", desc: alt ? "優先找材質安全、耐玩且不容易壞的玩具" : "找容易產生情感連結、會常常拿來玩的玩具", reason: "你提到小朋友情境，玩具要先考慮互動與陪伴感", k: ["兒童", "安全", "耐玩"] },
      { label: "偏創作手作方向", desc: "聚焦畫畫、拼貼、DIY、動手玩的創作型玩具", reason: "這類型能延長注意力與參與感", k: ["DIY", "手作", "創作"] },
      { label: "偏故事想像力方向", desc: "改找角色扮演、場景互動、故事延展型玩具", reason: ctx.negativePreferences.some((n) => n.includes("機器人")) ? "你說不要機器人，改走角色與場景想像更貼近需求" : "故事型玩具通常更有長期可玩性", k: ["角色", "場景", "想像力"] }
    ];
  }

  if ((ctx.relationship === "spouse" || ctx.relationship === "partner") && ctx.occasion === "birthday") {
    return [
      { label: "偏精緻但不浮誇方向", desc: "保留生日禮物質感，但避免過度高調與奢華", reason: "你已明確排除奢華或浮誇感", k: ["低調", "質感", "生日禮物"] },
      { label: "偏日常耐看方向", desc: "挑她平常真的會用、看久不膩的款式", reason: "日常可用能把心意延長到每一天", k: ["日常", "耐看", "實用"] },
      { label: "偏有心意但不炫耀方向", desc: "重點放在貼心細節與使用情境，不強調品牌炫耀", reason: "對不喜歡浮誇的人，低調心意通常更加分", k: ["貼心", "低調", "心意"] }
    ];
  }

  if (ctx.relationship === "parent" && ctx.recipientGender === "male") {
    return [
      { label: "偏實用耐用方向", desc: "先找日常能直接上手、不需改習慣的禮物", reason: "長輩男性通常對實用性與耐用度更敏感", k: ["實用", "耐用", "日常"] },
      { label: "偏低調有份量方向", desc: "挑穩重、有質感但不花俏的選項", reason: ctx.personality.includes("strict") ? "你提到個性嚴謹，低調但有份量更容易接受" : "穩重風格通常更不踩雷", k: ["穩重", "低調", "有份量"] },
      { label: "偏不打擾生活習慣方向", desc: "避開學習成本高或太新奇的商品", reason: ctx.personality.includes("conservative") ? "頑固/保守個性通常較排斥改變使用習慣" : "降低改變成本可提升接受度", k: ["簡單", "無學習成本", "易接受"] }
    ];
  }

  return [
    { label: alt ? "偏精緻送禮方向" : "偏質感送禮方向", desc: "先抓體面且容易被接受的禮物風格", reason: "先從成功率高的方向收斂範圍", k: ["質感", "送禮"] },
    { label: "偏日常可用方向", desc: "以對方平常可持續使用為優先", reason: "日常可用通常比較不踩雷", k: ["日常", "實用"] },
    { label: "偏安全牌方向", desc: "從中性接受度高的商品開始", reason: "當偏好不明確時先求穩定命中", k: ["中性", "安全牌"] }
  ];
}

export function buildNarrowing(parsed: ParsedIntent, regenCount = 0): { intro: string; options: NarrowOption[] } {
  const alt = regenCount % 2 === 1;
  const directions = buildDirectionSet(parsed.semanticContext, alt);
  const options: NarrowOption[] = [
    { id: "A", label: directions[0].label, description: directions[0].desc, reason: directions[0].reason, searchQuery: `${parsed.baseQuery} ${directions[0].k.join(" ")}` },
    { id: "B", label: directions[1].label, description: directions[1].desc, reason: directions[1].reason, searchQuery: `${parsed.baseQuery} ${directions[1].k.join(" ")}` },
    { id: "C", label: directions[2].label, description: directions[2].desc, reason: directions[2].reason, searchQuery: `${parsed.baseQuery} ${directions[2].k.join(" ")}` },
    { id: "D", label: "重新整理方向", description: alt ? "已重整一次，若仍不像可換描述" : "如果都不像，可以改描述或換條件重整", reason: "先修正方向比直接亂搜更快" }
  ];
  return { intro: INTRO, options };
}
