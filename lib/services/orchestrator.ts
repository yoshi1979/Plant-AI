import type { InboundPlantCase } from "@/lib/types";
import { analyzePlantImage } from "@/lib/services/vision";
import { validateDiagnosisAgainstExpertSources } from "@/lib/services/validation";
import { scoreFinalConfidence } from "@/lib/services/confidence";
import { formatWhatsAppReply } from "@/lib/services/formatter";
import { getPlantSecondOpinions } from "@/lib/providers/plant-model";
import { applySecondOpinion } from "@/lib/services/second-opinion";

export async function runDiagnosisPipeline(input: InboundPlantCase) {
  const initial = await analyzePlantImage(input.imageUrl, input.caption);
  const opinions = await getPlantSecondOpinions(input.imageUrl);
  const enriched = applySecondOpinion(initial, opinions);
  const validated = await validateDiagnosisAgainstExpertSources(enriched);
  const final = {
    ...validated,
    final_confidence_score_1_to_10: scoreFinalConfidence(validated)
  };

  return {
    diagnosis: final,
    replyText: formatWhatsAppReply(final)
  };
}
