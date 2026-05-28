import type { Candidate } from "@/lib/search/types";

type SerpItem = {
  title?: string;
  product_link?: string;
  link?: string;
  serpapi_product_api?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  thumbnail?: string;
  product_id?: string;
};

export async function searchSerpApi(query: string): Promise<{
  candidates: Candidate[];
  errorMessage?: string;
  serpRawCount: number;
  serpMappedCount: number;
  serpFirstRawKeys: string[];
  serpDiscardReason?: string;
  firstRawResultPreview?: Record<string, unknown>;
}> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return { candidates: [], errorMessage: "missing SERPAPI_API_KEY", serpRawCount: 0, serpMappedCount: 0, serpFirstRawKeys: [] };
  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", key);
    url.searchParams.set("hl", "zh-tw");
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return { candidates: [], errorMessage: `serpapi_failed:${res.status}`, serpRawCount: 0, serpMappedCount: 0, serpFirstRawKeys: [] };

    const data = (await res.json()) as { shopping_results?: SerpItem[] };
    const items = (data.shopping_results || []).slice(0, 8);
    const first = items[0] || {};

    const mapped = items
      .map((x, i) => {
        const link = x.product_link || x.link || x.serpapi_product_api || "";
        const title = x.title || "";
        const image = x.thumbnail || "";
        const price = x.price || (typeof x.extracted_price === "number" ? String(x.extracted_price) : "");
        const source = x.source || (x.serpapi_product_api && !x.link && !x.product_link ? "SerpAPI Product API" : "Google Shopping");
        const valid = Boolean(title && (image || link));
        return valid ? { id: x.product_id || `s${i}`, title, source, link, image, price } : null;
      })
      .filter(Boolean) as Candidate[];

    const discardReason = items.length > 0 && mapped.length === 0 ? "raw_results_exist_but_missing_required_fields(title + (thumbnail|link))" : undefined;

    return {
      candidates: mapped,
      errorMessage: mapped.length ? undefined : items.length ? "serpapi_failed:no_mappable_results" : "serpapi_failed:no_raw_results",
      serpRawCount: items.length,
      serpMappedCount: mapped.length,
      serpFirstRawKeys: Object.keys(first),
      serpDiscardReason: discardReason,
      firstRawResultPreview: first as Record<string, unknown>
    };
  } catch (e) {
    return { candidates: [], errorMessage: e instanceof Error ? `serpapi_failed:${e.message}` : "serpapi_failed", serpRawCount: 0, serpMappedCount: 0, serpFirstRawKeys: [] };
  }
}
