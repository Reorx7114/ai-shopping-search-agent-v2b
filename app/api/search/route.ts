import { NextResponse } from "next/server";
import { parseIntent } from "@/lib/search/intentParser";
import { buildNarrowing } from "@/lib/search/guidedShopping";
import { searchSerpApi } from "@/lib/search/serp";
import { mockCandidates } from "@/mockData";
import type { SearchRequest, SearchResponse } from "@/lib/search/types";

export async function POST(req: Request) {
  const body = await req.json() as SearchRequest;
  const useSerp = body.useSerp ?? process.env.USE_SERP === "true";
  const parsed = await parseIntent(body.input || "");
  const narrowing = buildNarrowing(parsed.parsed);
  const debug: SearchResponse["debug"] = { serpApiCalls: 0, searchProvider: "none", selectedOptionId: body.selectedOptionId, generatedSearchQueries: [], parserSource: parsed.parserSource, errorMessage: parsed.errorMessage };

  if (body.stage === "narrowing" || !body.selectedOptionId || body.selectedOptionId === "D") {
    if (body.stage === "narrowing") debug.errorMessage = "stage1 narrowing only";
    if (body.selectedOptionId === "D") debug.errorMessage = "selectedOption=D";
    return NextResponse.json({ intro: narrowing.intro, options: narrowing.options, candidates: [], comparisonTable: [], debug } satisfies SearchResponse);
  }

  const chosen = narrowing.options.find((x) => x.id === body.selectedOptionId);
  const queries = chosen?.searchQuery ? [chosen.searchQuery].slice(0, 2) : [];
  debug.generatedSearchQueries = queries;

  let candidates = [];
  if (!useSerp) {
    debug.searchProvider = "mock"; debug.errorMessage = "USE_SERP=false"; candidates = mockCandidates;
  } else if (!process.env.SERPAPI_API_KEY) {
    debug.searchProvider = "mock"; debug.errorMessage = "missing SERPAPI_API_KEY"; candidates = mockCandidates;
  } else {
    debug.serpApiCalls = queries.length;
    const out = await searchSerpApi(queries[0] || parsed.parsed.baseQuery);
    if (out.candidates.length) { candidates = out.candidates; debug.searchProvider = "serpapi"; }
    else { candidates = mockCandidates; debug.searchProvider = "mock"; debug.errorMessage = out.errorMessage || "SerpAPI failed"; }
  }

  return NextResponse.json({ intro: narrowing.intro, options: narrowing.options, candidates, comparisonTable: candidates.map(c => ({ title: c.title, source: c.source, price: c.price || "" })), debug } satisfies SearchResponse);
}
