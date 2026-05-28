export type OptionId = "A" | "B" | "C" | "D";
export type ParserSource = "openai" | "fallback";
export type SearchProvider = "serpapi" | "mock" | "none";
export type ResponseMode = "narrowing" | "results";

type Gender = "male" | "female" | "neutral" | "unknown";
type AgeGroup = "adult" | "teenager" | "child" | "toddler" | "senior" | "unknown";
type Relationship = "partner" | "spouse" | "parent" | "child" | "friend" | "relative" | "coworker" | "supervisor" | "subordinate" | "client" | "unknown";
type SocialPosition = "senior" | "elder" | "supervisor" | "executive" | "peer" | "junior" | "new_acquaintance" | "unknown";
type Occasion = "birthday" | "anniversary" | "holiday" | "workplace_gift" | "casual_gift" | "self_use" | "unknown";
type Personality = "strict" | "conservative" | "playful" | "practical" | "fashionable" | "low_key" | "picky" | "unknown";
type ProductCategory = "toy" | "bag" | "beauty" | "skincare" | "fragrance" | "accessory" | "food" | "home" | "tech" | "unknown";

type EmotionalTone = "safe" | "thoughtful" | "cute" | "warm" | "elegant" | "practical" | "playful" | "premium" | "low_key" | "creative";

export interface SemanticContext {
  recipientGender: Gender;
  recipientAgeGroup: AgeGroup;
  relationship: Relationship;
  socialPosition: SocialPosition;
  occasion: Occasion;
  personality: Personality[];
  productCategory: ProductCategory;
  negativePreferences: string[];
  emotionalTone: EmotionalTone[];
}

export interface NarrowOption { id: OptionId; label: string; description: string; reason: string; searchQuery?: string; }
export interface ParsedIntent { baseQuery: string; tags: string[]; semanticContext: SemanticContext; }
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
  semanticContext: SemanticContext;
  serpRawCount: number;
  serpMappedCount: number;
  serpFirstRawKeys: string[];
  serpDiscardReason?: string;
  firstRawResultPreview?: Record<string, unknown>;
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
