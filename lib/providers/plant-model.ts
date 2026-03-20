import { config } from "@/lib/config";
import type { PlantSecondOpinion } from "@/lib/types";

export async function getPlantSecondOpinion(imageUrl: string): Promise<PlantSecondOpinion | null> {
  if (config.plantModelProvider === "none" || !config.plantModelApiKey) return null;

  if (config.plantModelProvider === "plantid") {
    return getPlantIdSecondOpinion(imageUrl);
  }

  return null;
}

async function getPlantIdSecondOpinion(imageUrl: string): Promise<PlantSecondOpinion | null> {
  const response = await fetch(config.plantModelEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": config.plantModelApiKey
    },
    body: JSON.stringify({
      images: [imageUrl],
      similar_images: false
    }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = await response.json();

  const plantSuggestion = payload?.result?.classification?.suggestions?.[0];
  const diseaseSuggestions = payload?.result?.disease?.suggestions ?? payload?.result?.health_assessment?.diseases ?? [];

  return {
    provider: "plantid",
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

function normalizeScore(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric <= 1) return Math.round(numeric * 10);
  return Math.max(0, Math.min(10, Math.round(numeric)));
}
