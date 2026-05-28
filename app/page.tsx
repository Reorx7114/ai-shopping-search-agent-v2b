"use client";
import { useState } from "react";
import type { NarrowOption, OptionId, SearchResponse } from "@/lib/search/types";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [regenCount, setRegenCount] = useState(0);

  async function call(stage: "narrowing" | "results", selectedOptionId?: OptionId) {
    const nextRegen = selectedOptionId === "D" ? regenCount + 1 : regenCount;
    const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, stage, selectedOptionId, regenCount: nextRegen }) });
    const json = (await res.json()) as SearchResponse;
    setData(json);
    if (selectedOptionId === "D") setRegenCount(nextRegen);
  }

  const mockReason = !data ? "" : data.debug.errorMessage?.includes("USE_SERP=false")
    ? "目前未啟用真實搜尋，以下為 Local Mock 結果。"
    : data.debug.errorMessage?.includes("missing SERPAPI_API_KEY")
      ? "尚未設定 SerpAPI key，以下為 Local Mock 結果。"
      : data.debug.serpApiCalls > 0 && data.debug.serpRawCount > 0 && data.debug.serpMappedCount === 0
        ? "已呼叫 SerpAPI，但目前沒有成功轉成可用商品結果，以下暫時顯示 Local Mock。"
        : data.debug.selectedOptionId === "D"
          ? "重新整理方向，不進行商品搜尋。"
          : "目前顯示 Local Mock 結果。";

  return <main className="mx-auto max-w-5xl p-6 space-y-6">
    <h1 className="text-2xl font-semibold">AI Guided Shopping V2B</h1>
    <section className="bg-white rounded-lg border p-4 space-y-3">
      <textarea className="w-full border rounded p-3" value={input} onChange={(e) => setInput(e.target.value)} placeholder="描述你的需求" />
      <button className="px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-40" onClick={() => call("narrowing")} disabled={!input.trim()}>幫我整理方向</button>
    </section>

    {data && <section className="space-y-4">
      <p className="text-sm text-slate-700">{data.intro}</p>
      <div className="grid md:grid-cols-2 gap-4">
        {data.options.map((o: NarrowOption) => <article key={o.id} className="bg-white border rounded-lg p-4 hover:shadow transition-shadow">
          <h3 className="font-semibold">選項 {o.id}：{o.label}</h3>
          <p className="text-sm mt-2">{o.description}</p>
          <p className="text-xs text-slate-500 mt-2">理由：{o.reason}</p>
          <button className="mt-3 text-sm underline" onClick={() => call(o.id === "D" ? "narrowing" : "results", o.id)}>{o.id === "D" ? "重新整理方向" : "選這個方向"}</button>
        </article>)}
      </div>

      {data.mode === "results" && <>
        {data.debug.searchProvider === "mock" ? <p className="text-xs text-amber-700">{mockReason}</p> : null}
        <div className="grid md:grid-cols-3 gap-4">
          {data.candidates.map((c) => <article key={c.id} className="bg-white border rounded overflow-hidden">
            <img src={c.image} alt={c.title} className="h-40 w-full object-cover" />
            <div className="p-3 space-y-1">
              <h4 className="text-sm font-medium">{c.title}</h4>
              <p className="text-xs text-slate-500">{c.source}</p>
              {c.link ? <a href={c.link} target="_blank" rel="noreferrer" className="text-xs underline">查看連結</a> : <p className="text-xs text-amber-700">Local Mock（無真實商品連結）</p>}
            </div>
          </article>)}
        </div>
      </>}

      <button type="button" className="text-xs underline text-slate-500" onClick={() => setShowDebug((v) => !v)}>{showDebug ? "隱藏" : "顯示"} debug</button>
      {showDebug && <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded overflow-auto">{JSON.stringify(data.debug, null, 2)}</pre>}
    </section>}
  </main>;
}
