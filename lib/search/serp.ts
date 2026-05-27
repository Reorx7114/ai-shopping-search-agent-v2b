import type { Candidate } from "@/lib/search/types";

export async function searchSerpApi(query: string): Promise<{ candidates: Candidate[]; errorMessage?: string }> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { candidates: [], errorMessage: "missing SERPAPI_API_KEY" };
  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", key);
    const res = await fetch(url.toString());
    const data = await res.json() as any;
    const items = (data.shopping_results || []).slice(0, 6);
    return {
      candidates: items.map((x: any, i: number) => ({ id: `s${i}`, title: x.title || "(no title)", source: x.source || "Google Shopping", link: x.link || "", image: x.thumbnail || "", price: x.price || "" }))
    };
  } catch (e) {
    return { candidates: [], errorMessage: e instanceof Error ? e.message : "serp failed" };
  }
}
