import type { InboundPlantCase } from "@/lib/types";
import { analyzePlantImage } from "@/lib/services/vision";
import { validateDiagnosisAgainstExpertSources } from "@/lib/services/validation";
import { scoreFinalConfidence } from "@/lib/services/confidence";
import { formatWhatsAppReply } from "@/lib/services/formatter";

export async function runDiagnosisPipeline(input: InboundPlantCase) {
  const initial = await analyzePlantImage(input.imageUrl, input.caption);
  const validated = await validateDiagnosisAgainstExpertSources(initial);
  const final = {
    ...validated,
    final_confidence_score_1_to_10: scoreFinalConfidence(validated)
  };

  return {
    diagnosis: final,
    replyText: formatWhatsAppReply(final)
  };
}
