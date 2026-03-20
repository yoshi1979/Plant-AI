import { sendWhatsAppText } from "@/lib/providers/whatsapp";
import { persistDiagnosisCase } from "@/lib/repositories/cases";
import { runDiagnosisPipeline } from "@/lib/services/orchestrator";
import { log } from "@/lib/logger";
import type { InboundPlantCase } from "@/lib/types";

export async function processDiagnosisCase(input: InboundPlantCase) {
  const { diagnosis, replyText } = await runDiagnosisPipeline(input);

  const delivery = await sendWhatsAppText(input.whatsappNumber, replyText);
  if (!delivery.ok && !delivery.skipped) {
    throw new Error(`WhatsApp delivery failed with status ${delivery.status}`);
  }

  try {
    await persistDiagnosisCase(input, diagnosis, replyText);
  } catch (error) {
    log("warn", "Diagnosis persistence failed after reply was sent", {
      messageId: input.messageId,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });
  }

  return { diagnosis, replyText };
}
