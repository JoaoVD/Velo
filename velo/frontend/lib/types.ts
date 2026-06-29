export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  created_at: string;
}

export interface Keyword {
  id: string;
  brand_id: string;
  term: string;
  created_at: string;
}

export interface Score {
  id: string;
  keyword_id: string;
  engine: "chatgpt" | "gemini";
  date: string;
  mention_score: number;
  position_score: number;
  sentiment_score: number;
  frequency_score: number;
  geo_score: number;
}

export interface Report {
  id: string;
  brand_id: string;
  period_start: string;
  period_end: string;
  content_md: string;
  created_at: string;
}

export interface ActionPlan {
  id: string;
  keyword_id: string;
  engine: "chatgpt" | "gemini";
  recommendation: string;
  priority: "high" | "medium" | "low";
  created_at: string;
}
