export type OptionId = "A" | "B" | "C" | "D";
export type ParserSource = "openai" | "fallback";
export type SearchProvider = "serpapi" | "mock" | "none";

export interface NarrowOption { id: OptionId; label: string; description: string; reason: string; searchQuery?: string; }
export interface ParsedIntent { baseQuery: string; tags: string[]; }
export interface Candidate { id: string; title: string; source: string; link: string; image: string; price?: string; }

export interface SearchRequest { input: string; stage: "narrowing" | "results"; selectedOptionId?: OptionId; useSerp?: boolean; }

export interface SearchDebug {
  serpApiCalls: number;
  searchProvider: SearchProvider;
  selectedOptionId?: OptionId;
  generatedSearchQueries: string[];
  parserSource: ParserSource;
  errorMessage?: string;
}

export interface SearchResponse {
  intro: string;
  options: NarrowOption[];
  candidates: Candidate[];
  comparisonTable: Array<{ title: string; source: string; price: string }>;
  debug: SearchDebug;
}
