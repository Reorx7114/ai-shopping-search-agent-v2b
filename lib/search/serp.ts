import type { Candidate } from "@/lib/search/types";

type SerpItem = { title?: string; source?: string; link?: string; product_link?: string; thumbnail?: string; price?: string };

export async function searchSerpApi(query: string): Promise<{ candidates: Candidate[]; errorMessage?: string }> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { candidates: [], errorMessage: "missing SERPAPI_API_KEY" };
  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", key);
    url.searchParams.set("hl", "zh-tw");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return { candidates: [], errorMessage: `serpapi_failed:${res.status}` };
    const data = (await res.json()) as { shopping_results?: SerpItem[] };
    const items = (data.shopping_results || []).slice(0, 6);
    const candidates = items
      .map((x, i) => ({ id: `s${i}`, title: x.title || "(no title)", source: x.source || "Google Shopping", link: x.product_link || x.link || "", image: x.thumbnail || "", price: x.price || "" }))
      .filter((c) => Boolean(c.link));
    return { candidates, errorMessage: candidates.length ? undefined : "serpapi_failed:no_valid_results" };
  } catch (e) {
    return { candidates: [], errorMessage: e instanceof Error ? `serpapi_failed:${e.message}` : "serpapi_failed" };
  }
}
