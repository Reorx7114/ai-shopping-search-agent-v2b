import { NextResponse } from "next/server";
import { parseIntent } from "@/lib/search/intentParser";
import { buildNarrowing } from "@/lib/search/guidedShopping";
import { searchSerpApi } from "@/lib/search/serp";
import { mockCandidates } from "@/mockData";
import type { SearchRequest, SearchResponse } from "@/lib/search/types";

function isTrue(value: string | undefined): boolean {
  return ["true", "1", "yes", "on"].includes((value || "").trim().toLowerCase());
}

export async function POST(req: Request) {
  const body = (await req.json()) as SearchRequest;
  const envUseSerp = isTrue(process.env.USE_SERP);
  const useSerpEnabled = body.useSerp ?? envUseSerp;
  const hasSerpApiKey = Boolean(process.env.SERPAPI_API_KEY);

  const parsed = await parseIntent(body.input || "");
  const narrowing = buildNarrowing(parsed.parsed, body.regenCount ?? 0);
  const debug: SearchResponse["debug"] = {
    serpApiCalls: 0,
    searchProvider: "none",
    selectedOptionId: body.selectedOptionId,
    generatedSearchQueries: [],
    parserSource: parsed.parserSource,
    useSerpEnabled,
    hasSerpApiKey,
    semanticContext: parsed.parsed.semanticContext,
    serpRawCount: 0,
    serpMappedCount: 0,
    serpFirstRawKeys: [],
    errorMessage: parsed.errorMessage
  };

  if (body.stage === "narrowing" || !body.selectedOptionId || body.selectedOptionId === "D") {
    debug.errorMessage = body.selectedOptionId === "D" ? "selectedOption=D; user requested re-narrowing" : "stage1 narrowing only";
    return NextResponse.json({ mode: "narrowing", intro: narrowing.intro, options: narrowing.options, candidates: [], comparisonTable: [], debug } satisfies SearchResponse);
  }

  const chosen = narrowing.options.find((x) => x.id === body.selectedOptionId);
  const queries = chosen?.searchQuery ? [chosen.searchQuery].slice(0, 2) : [parsed.parsed.baseQuery];
  debug.generatedSearchQueries = queries;

  let candidates = [];
  if (!useSerpEnabled) {
    debug.searchProvider = "mock";
    debug.errorMessage = "USE_SERP=false";
    candidates = mockCandidates;
  } else if (!hasSerpApiKey) {
    debug.searchProvider = "mock";
    debug.errorMessage = "missing SERPAPI_API_KEY";
    candidates = mockCandidates;
  } else {
    const out = await searchSerpApi(queries[0]);
    debug.serpApiCalls = 1;
    debug.serpRawCount = out.serpRawCount;
    debug.serpMappedCount = out.serpMappedCount;
    debug.serpFirstRawKeys = out.serpFirstRawKeys;
    debug.serpDiscardReason = out.serpDiscardReason;
    debug.firstRawResultPreview = out.firstRawResultPreview;

    if (out.candidates.length > 0) {
      candidates = out.candidates;
      debug.searchProvider = "serpapi";
    } else {
      candidates = mockCandidates;
      debug.searchProvider = "mock";
      debug.errorMessage = out.errorMessage || "serpapi_failed";
    }
  }

  return NextResponse.json({ mode: "results", intro: narrowing.intro, options: narrowing.options, candidates, comparisonTable: candidates.map((c) => ({ title: c.title, source: c.source, price: c.price || "" })), debug } satisfies SearchResponse);
}
