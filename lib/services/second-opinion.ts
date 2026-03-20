import type { DiagnosisResult, PlantEnsembleOpinion, PlantSecondOpinion } from "@/lib/types";

export function applySecondOpinion(result: DiagnosisResult, opinions: PlantSecondOpinion[]): DiagnosisResult {
  if (!opinions.length) return result;

  const ensemble = buildEnsemble(result, opinions);
  const topConsensusIssue = ensemble.consensus_issue_candidates[0];
  const primaryIssue = result.likely_issues[0]?.name?.toLowerCase() ?? "";
  const issueMatch = topConsensusIssue?.name && (primaryIssue.includes(topConsensusIssue.name.toLowerCase()) || topConsensusIssue.name.toLowerCase().includes(primaryIssue));
  const plantConfidence = ensemble.consensus_plant_name && result.plant_identification.name.toLowerCase() === ensemble.consensus_plant_name.toLowerCase()
    ? Math.min(10, Math.round((result.plant_identification.confidence + average(opinions.map((x) => x.plant_confidence ?? 0))) / 2 + 1))
    : result.plant_identification.confidence;

  const likelyIssues = issueMatch || !topConsensusIssue
    ? result.likely_issues
    : [
        {
          name: topConsensusIssue.name,
          confidence: Math.max(result.likely_issues[0]?.confidence ?? 0, topConsensusIssue.confidence),
          reasoning: "Plant API ensemble ranked this as the strongest second-opinion issue candidate."
        },
        ...result.likely_issues.filter((x) => x.name !== topConsensusIssue.name)
      ];

  return {
    ...result,
    plant_identification: {
      name: ensemble.consensus_plant_name ?? result.plant_identification.name,
      confidence: plantConfidence
    },
    likely_issues: likelyIssues,
    second_opinion: opinions[0],
    ensemble_opinion: ensemble
  };
}

function buildEnsemble(result: DiagnosisResult, opinions: PlantSecondOpinion[]): PlantEnsembleOpinion {
  const issueMap = new Map<string, number[]>();
  const plantMap = new Map<string, number[]>();

  for (const opinion of opinions) {
    if (opinion.plant_name) {
      const key = opinion.plant_name;
      plantMap.set(key, [...(plantMap.get(key) ?? []), opinion.plant_confidence ?? 0]);
    }
    for (const issue of opinion.issue_candidates) {
      issueMap.set(issue.name, [...(issueMap.get(issue.name) ?? []), issue.confidence]);
    }
  }

  const consensusPlant = rankEntries(plantMap)[0]?.name;
  const consensusIssues = rankEntries(issueMap).slice(0, 4);
  const primaryIssue = result.likely_issues[0]?.name?.toLowerCase() ?? "";
  const agrees = consensusIssues.some((x) => primaryIssue.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(primaryIssue));
  const agreement = agrees ? "high" : opinions.length > 1 ? "medium" : "low";

  return {
    providers: opinions,
    agreement_with_primary: agreement,
    consensus_plant_name: consensusPlant,
    consensus_issue_candidates: consensusIssues,
    summary: `Plant ensemble used ${opinions.map((x) => x.provider).join(", ")} and selected the strongest shared candidates.`
  };
}

function rankEntries(map: Map<string, number[]>) {
  return [...map.entries()]
    .map(([name, scores]) => ({ name, confidence: Math.round(average(scores)) }))
    .sort((a, b) => b.confidence - a.confidence);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, x) => sum + x, 0) / values.length;
}
