type CaseItem = {
  id: string;
  whatsappNumber: string;
  detectedPlantName: string | null;
  healthStatus: string;
  primaryIssue: string | null;
  confidenceScore: number;
  validationStrength: string;
  updatedAt: string;
};

const demoCases: CaseItem[] = [
  {
    id: "demo-case-1",
    whatsappNumber: "+15551230000",
    detectedPlantName: "Monstera deliciosa",
    healthStatus: "mild_stress",
    primaryIssue: "Likely overwatering with early fungal leaf spotting",
    confidenceScore: 8,
    validationStrength: "strong",
    updatedAt: new Date().toISOString()
  }
];

export async function listRecentCases(): Promise<CaseItem[]> {
  return demoCases;
}
