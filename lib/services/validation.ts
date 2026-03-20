import { config } from "@/lib/config";
import { buildValidationPrompt } from "@/lib/prompts";
import { openaiResponses, extractTextFromResponse } from "@/lib/providers/openai";
import type { DiagnosisResult, ValidationStrength } from "@/lib/types";

const trustedDomains = [
  { domain: ".edu", sourceType: "university extension" },
  { domain: ".gov", sourceType: "government agriculture" },
  { domain: "rhs.org.uk", sourceType: "horticulture organization" },
  { domain: "missouribotanicalgarden.org", sourceType: "botanical garden" },
  { domain: "apsnet.org", sourceType: "plant pathology" },
  { domain: "gardenersworld.com", sourceType: "plant-care database" }
];

type ValidationSource = { title: string; url: string; sourceType: string; snippet: string };
type CandidateValidation = {
  issue: { name: string; confidence: number; reasoning: string };
  sources: ValidationSource[];
  validationStrength: ValidationStrength;
  score: number;
};

export async function validateDiagnosisAgainstExpertSources(draft: DiagnosisResult): Promise<DiagnosisResult> {
  const checkedAt = new Date().toISOString();
  const candidates = await Promise.all(
    draft.likely_issues.slice(0, 4).map(async (issue) => {
      const query = buildQuery(draft.plant_identification.name, issue.name, draft.observed_symptoms);
      const sources = await searchTrustedSources(query);
      const validationStrength = inferValidationStrengthFromCandidate(issue.confidence, sources.length);
      const score = scoreCandidate(issue.confidence, validationStrength, sources.length);
      return { issue, sources, validationStrength, score } satisfies CandidateValidation;
    })
  );

  const best = candidates.sort((a, b) => b.score - a.score)[0];

  if (!best || !best.sources.length) {
    return {
      ...draft,
      expert_validation: {
        performed: true,
        validation_strength: "unavailable",
        source_types_used: [],
        summary: "Trusted-source live validation was unavailable, so recommendations stay conservative and fresh guidance could not be confirmed.",
        checked_at: checkedAt,
        freshness: "unknown"
      },
      recommended_actions: conservativeActions(),
      prevention_tips: conservativePrevention(),
      follow_up_questions: ensureFollowUps(draft.follow_up_questions)
    };
  }

  const aiValidated = config.aiApiKey
    ? await synthesizeValidationWithModel({ ...draft, likely_issues: [best.issue, ...draft.likely_issues.filter((x) => x.name !== best.issue.name)] }, best.sources)
    : null;

  const winningIssue = best.issue.name;
  const validationStrength = aiValidated?.validation_strength ?? best.validationStrength;
  const recommendedActions = aiValidated?.recommended_actions ?? conservativeActions();
  const preventionTips = aiValidated?.prevention_tips ?? conservativePrevention();
  const followUpQuestions = aiValidated?.follow_up_questions ?? ensureFollowUps(draft.follow_up_questions);
  const escalationNeeded = aiValidated?.escalation_needed ?? draft.health_assessment.status === "severe_issue";
  const escalationReason = aiValidated?.escalation_reason ?? (escalationNeeded ? "Severe or unclear case may need local expert review." : "");
  const summary = aiValidated?.summary ?? `Live validation checked trusted sources at ${checkedAt}. Best-supported issue was ${winningIssue}. Evidence is ${validationStrength}.`;

  return {
    ...draft,
    likely_issues: [best.issue, ...draft.likely_issues.filter((x) => x.name !== best.issue.name)],
    expert_validation: {
      performed: true,
      validation_strength: validationStrength,
      source_types_used: [...new Set(best.sources.map((s) => s.sourceType))],
      summary,
      checked_at: checkedAt,
      freshness: "live",
      winning_issue: winningIssue,
      sources: best.sources
    },
    recommended_actions: recommendedActions,
    prevention_tips: preventionTips,
    follow_up_questions: followUpQuestions,
    escalation_needed: escalationNeeded,
    escalation_reason: escalationReason
  };
}

function buildQuery(plantName: string, primaryIssue: string, symptoms: string[]) {
  return [plantName, primaryIssue, ...symptoms, "site:.edu OR site:.gov OR rhs.org.uk OR missouribotanicalgarden.org OR apsnet.org"]
    .filter(Boolean)
    .join(" ");
}

async function searchTrustedSources(query: string): Promise<ValidationSource[]> {
  if (!config.searchApiKey) return [];
  if (config.searchProvider !== "tavily") return [];

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.searchApiKey,
      query,
      search_depth: "advanced",
      max_results: 8,
      include_raw_content: false,
      topic: "general",
      days: 30
    }),
    cache: "no-store"
  });

  if (!response.ok) return [];
  const payload = await response.json();
  const results = Array.isArray(payload?.results) ? payload.results : [];

  return results
    .filter((item: any) => {
      try {
        const hostname = new URL(item.url).hostname.toLowerCase();
        return trustedDomains.some((d) => hostname.endsWith(d.domain) || hostname === d.domain);
      } catch {
        return false;
      }
    })
    .slice(0, 5)
    .map((item: any) => {
      const hostname = new URL(item.url).hostname.toLowerCase();
      const match = trustedDomains.find((d) => hostname.endsWith(d.domain) || hostname === d.domain);
      return {
        title: item.title ?? item.url,
        url: item.url,
        sourceType: match?.sourceType ?? "trusted plant source",
        snippet: item.content ?? item.snippet ?? ""
      };
    });
}

async function synthesizeValidationWithModel(draft: DiagnosisResult, sources: ValidationSource[]) {
  try {
    const response = await openaiResponses({
      model: config.aiTextModel,
      input: [
        {
          role: "user",
          content: [{
            type: "input_text",
            text: buildValidationPrompt({
              plantName: draft.plant_identification.name,
              observedSymptoms: draft.observed_symptoms,
              likelyIssues: draft.likely_issues,
              sources
            })
          }]
        }
      ]
    });

    const text = stripCodeFences(extractTextFromResponse(response));
    return JSON.parse(text) as {
      validation_strength: ValidationStrength;
      summary: string;
      recommended_actions: { priority: number; action: string; why: string }[];
      prevention_tips: string[];
      follow_up_questions: string[];
      escalation_needed: boolean;
      escalation_reason: string;
    };
  } catch {
    return null;
  }
}

function inferValidationStrengthFromCandidate(issueConfidence: number, sourceCount: number): ValidationStrength {
  if (!sourceCount) return "unavailable";
  if (issueConfidence >= 8 && sourceCount >= 3) return "strong";
  if (issueConfidence >= 6 && sourceCount >= 2) return "partial";
  return "weak";
}

function scoreCandidate(issueConfidence: number, validationStrength: ValidationStrength, sourceCount: number) {
  const strengthScore = { strong: 4, partial: 2, weak: 1, conflicting: -1, unavailable: -2 }[validationStrength];
  return issueConfidence + strengthScore + Math.min(sourceCount, 3);
}

function conservativeActions() {
  return [
    { priority: 1, action: "Avoid major treatment changes until the diagnosis is clearer.", why: "Prevents overcorrecting based on uncertain symptoms." },
    { priority: 2, action: "Check whether the soil is soggy, dry, compacted, or smells sour before watering again.", why: "Helps narrow watering and root problems safely." },
    { priority: 3, action: "Isolate the plant if you suspect fungus or pests and monitor for spread.", why: "Reduces risk to nearby plants while you gather more evidence." }
  ];
}

function conservativePrevention() {
  return [
    "Use consistent light and avoid abrupt environment changes.",
    "Inspect leaves, stems, and soil weekly so problems are caught early."
  ];
}

function ensureFollowUps(existing: string[]) {
  return existing.length ? existing.slice(0, 4) : [
    "Is this plant indoors or outdoors?",
    "How often do you water it?",
    "When did this problem start?",
    "Can you send a whole-plant photo, a close-up, and a soil photo?"
  ];
}

function stripCodeFences(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
}
