import { sendWhatsAppText } from "@/lib/providers/whatsapp";
import { persistDiagnosisCase } from "@/lib/repositories/cases";
import { runDiagnosisPipeline } from "@/lib/services/orchestrator";
import type { InboundPlantCase } from "@/lib/types";

export async function processDiagnosisCase(input: InboundPlantCase) {
  const { diagnosis, replyText } = await runDiagnosisPipeline(input);
  await persistDiagnosisCase(input, diagnosis, replyText);
  await sendWhatsAppText(input.whatsappNumber, replyText);
  return { diagnosis, replyText };
}
