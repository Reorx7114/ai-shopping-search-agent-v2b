"use client";
import { useState } from "react";
import type { NarrowOption, SearchResponse } from "@/lib/search/types";

export default function Home() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  async function call(stage: "narrowing" | "results", selectedOptionId?: "A"|"B"|"C"|"D") {
    const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input, stage, selectedOptionId })});
    setData(await res.json());
  }

  return <main style={{maxWidth:900, margin:"24px auto", padding:16}}>
    <h1>AI Guided Shopping V2B</h1>
    <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="描述你的需求" style={{width:"100%",height:90}}/>
    <button onClick={()=>call("narrowing")} disabled={!input.trim()}>開始</button>
    {data && <section>
      <p>{data.intro}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
        {data.options.map((o:NarrowOption)=><article key={o.id} style={{border:"1px solid #ccc",padding:10,borderRadius:8}}>
          <h3>選項 {o.id}：{o.label}</h3><p>{o.description}</p><small>理由：{o.reason}</small><br/>
          <button onClick={()=>call("results",o.id)}>選這個方向</button>
        </article>)}
      </div>
      <h3>商品結果</h3>
      <ul>{data.candidates.map(c=><li key={c.id}><a href={c.link} target="_blank">{c.title}</a> - {c.source} - {c.price}</li>)}</ul>
      <button onClick={()=>setShowDebug(!showDebug)}>{showDebug?"隱藏":"顯示"} debug</button>
      {showDebug && <pre>{JSON.stringify(data.debug,null,2)}</pre>}
    </section>}
  </main>;
}
