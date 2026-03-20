import { config } from "@/lib/config";
import type { PlantSecondOpinion } from "@/lib/types";

export async function getPlantSecondOpinions(imageUrl: string): Promise<PlantSecondOpinion[]> {
  const jobs: Promise<PlantSecondOpinion | null>[] = [];

  if (config.plantModelProvider !== "none" && config.plantModelApiKey) {
    jobs.push(runProvider(config.plantModelProvider, config.plantModelEndpoint, config.plantModelApiKey, imageUrl, false));
  }
  if (config.plantModelProvider2 !== "none" && config.plantModelApiKey2) {
    jobs.push(runProvider(config.plantModelProvider2, config.plantModelEndpoint2 || config.plantModelEndpoint, config.plantModelApiKey2, imageUrl, true));
  }

  const results = await Promise.all(jobs);
  return results.filter(Boolean) as PlantSecondOpinion[];
}

async function runProvider(provider: string, endpoint: string, apiKey: string, imageUrl: string, secondary: boolean): Promise<PlantSecondOpinion | null> {
  if (provider === "plantid") {
    return getPlantIdSecondOpinion(endpoint, apiKey, imageUrl, secondary ? "plantid-2" : "plantid");
  }
  if (provider === "kindwise") {
    return getKindwiseSecondOpinion(endpoint || "https://plant.kindwise.com/api/v1/identification", apiKey, imageUrl);
  }
  return null;
}

async function getPlantIdSecondOpinion(endpoint: string, apiKey: string, imageUrl: string, providerName: string): Promise<PlantSecondOpinion | null> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey
    },
    body: JSON.stringify({ images: [imageUrl], similar_images: false }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = await response.json();
  const plantSuggestion = payload?.result?.classification?.suggestions?.[0];
  const diseaseSuggestions = payload?.result?.disease?.suggestions ?? payload?.result?.health_assessment?.diseases ?? [];

  return {
    provider: providerName,
    checked_at: new Date().toISOString(),
    plant_name: plantSuggestion?.name,
    plant_confidence: normalizeScore(plantSuggestion?.probability),
    issue_candidates: diseaseSuggestions.slice(0, 4).map((item: any) => ({
      name: item.name ?? item.common_name ?? "Unknown issue",
      confidence: normalizeScore(item.probability ?? item.similarity)
    })),
    summary: "Dedicated plant model returned a second opinion from a plant-specific API."
  };
}

async function getKindwiseSecondOpinion(endpoint: string, apiKey: string, imageUrl: string): Promise<PlantSecondOpinion | null> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey
    },
    body: JSON.stringify({ images: [imageUrl], latitude: null, longitude: null }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = await response.json();
  const topPlant = payload?.result?.classification?.suggestions?.[0] ?? payload?.suggestions?.[0];
  const topIssues = payload?.result?.disease?.suggestions ?? payload?.health_assessment?.diseases ?? [];

  return {
    provider: "kindwise",
    checked_at: new Date().toISOString(),
    plant_name: topPlant?.name,
    plant_confidence: normalizeScore(topPlant?.probability),
    issue_candidates: topIssues.slice(0, 4).map((item: any) => ({
      name: item.name ?? item.common_name ?? "Unknown issue",
      confidence: normalizeScore(item.probability ?? item.similarity)
    })),
    summary: "Second plant API returned an ensemble opinion from a plant-specific provider."
  };
}

function normalizeScore(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric <= 1) return Math.round(numeric * 10);
  return Math.max(0, Math.min(10, Math.round(numeric)));
}
