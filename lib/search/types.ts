export type OptionId = "A" | "B" | "C" | "D";
export type ParserSource = "openai" | "fallback";
export type SearchProvider = "serpapi" | "mock" | "none";
export type ResponseMode = "narrowing" | "results";

export interface NarrowOption { id: OptionId; label: string; description: string; reason: string; searchQuery?: string; }
export interface ParsedIntent { baseQuery: string; tags: string[]; }
export interface Candidate { id: string; title: string; source: string; link: string; image: string; price?: string; isMock?: boolean; }

export interface SearchRequest { input: string; stage: "narrowing" | "results"; selectedOptionId?: OptionId; useSerp?: boolean; regenCount?: number; }

export interface SearchDebug {
  serpApiCalls: number;
  searchProvider: SearchProvider;
  selectedOptionId?: OptionId;
  generatedSearchQueries: string[];
  parserSource: ParserSource;
  useSerpEnabled: boolean;
  hasSerpApiKey: boolean;
  errorMessage?: string;
}

export interface SearchResponse {
  mode: ResponseMode;
  intro: string;
  options: NarrowOption[];
  candidates: Candidate[];
  comparisonTable: Array<{ title: string; source: string; price: string }>;
  debug: SearchDebug;
}
