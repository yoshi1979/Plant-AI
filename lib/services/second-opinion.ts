import type { DiagnosisResult, PlantSecondOpinion } from "@/lib/types";

export function applySecondOpinion(result: DiagnosisResult, secondOpinion: PlantSecondOpinion | null): DiagnosisResult {
  if (!secondOpinion) return result;

  const primaryIssue = result.likely_issues[0]?.name?.toLowerCase() ?? "";
  const topSecondIssue = secondOpinion.issue_candidates[0]?.name?.toLowerCase() ?? "";
  const plantMatch = secondOpinion.plant_name && result.plant_identification.name && secondOpinion.plant_name.toLowerCase() === result.plant_identification.name.toLowerCase();
  const issueMatch = primaryIssue && topSecondIssue && (primaryIssue.includes(topSecondIssue) || topSecondIssue.includes(primaryIssue));

  const agreement = plantMatch || issueMatch ? "high" : secondOpinion.issue_candidates.length ? "medium" : "low";
  const plantConfidence = plantMatch
    ? Math.min(10, Math.round(((result.plant_identification.confidence + (secondOpinion.plant_confidence ?? 0)) / 2) + 1))
    : result.plant_identification.confidence;

  const likelyIssues = issueMatch || !secondOpinion.issue_candidates.length
    ? result.likely_issues
    : [
        {
          name: secondOpinion.issue_candidates[0].name,
          confidence: Math.max(result.likely_issues[0]?.confidence ?? 0, secondOpinion.issue_candidates[0].confidence),
          reasoning: `Dedicated plant model suggested this as a strong second opinion.`
        },
        ...result.likely_issues.filter((x) => x.name !== secondOpinion.issue_candidates[0].name)
      ];

  return {
    ...result,
    plant_identification: {
      name: plantMatch ? (secondOpinion.plant_name ?? result.plant_identification.name) : result.plant_identification.name,
      confidence: plantConfidence
    },
    likely_issues: likelyIssues,
    second_opinion: {
      ...secondOpinion,
      agreement_with_primary: agreement
    }
  };
}
