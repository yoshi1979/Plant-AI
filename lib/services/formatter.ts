import type { DiagnosisResult, HealthStatus, ValidationStrength } from "@/lib/types";
import type { ReplyLanguage } from "@/lib/services/language";

export function formatWhatsAppReply(result: DiagnosisResult, language: ReplyLanguage = "en"): string {
  const t = dictionary[language];
  const primary = result.likely_issues[0]?.name ?? t.unclearIssue;
  const secondary = result.likely_issues[1]?.name;
  const lowConfidence = result.final_confidence_score_1_to_10 < 7;

  return [
    `${t.plant}: ${result.plant_identification.name || t.unknownPlant}`,
    `${t.status}: ${statusLabel(result.health_assessment.status, language)}`,
    `${t.confidence}: ${result.final_confidence_score_1_to_10}/10 ${confidenceReason(result.final_confidence_score_1_to_10, language)}`,
    "",
    `${t.whatISee}:`,
    ...result.observed_symptoms.map((item) => `- ${item}`),
    "",
    `${t.likelyIssue}:`,
    `- ${primary}`,
    ...(secondary ? [`- ${t.secondary}: ${secondary}`] : []),
    "",
    `${t.validated}:`,
    `- ${t.crossChecked}`,
    `- ${t.freshness}: ${freshnessLabel(result.expert_validation.freshness ?? "unknown", language)}${result.expert_validation.checked_at ? ` (${result.expert_validation.checked_at})` : ""}`,
    ...(result.expert_validation.winning_issue ? [`- ${t.bestSupported}: ${result.expert_validation.winning_issue}`] : []),
    `- ${t.validationStrength}: ${validationLabel(result.expert_validation.validation_strength, language)}`,
    `- ${result.expert_validation.summary}`,
    ...(result.ensemble_opinion ? ["", `${t.secondOpinion}:`, `- ${result.ensemble_opinion.summary}`] : []),
    "",
    `${t.doNow}:`,
    ...result.recommended_actions.map((item) => `${item.priority}. ${item.action}${item.why ? ` — ${item.why}` : ""}`),
    "",
    `${t.prevention}:`,
    ...result.prevention_tips.map((item) => `- ${item}`),
    "",
    `${t.urgency}: ${urgencyLabel(result.health_assessment.status, language)}`,
    ...(lowConfidence
      ? [
          "",
          `${t.needMoreInfo}:`,
          ...result.follow_up_questions.slice(0, 4).map((item) => `- ${item}`),
          "",
          ...t.photoGuide
        ]
      : [])
  ].join("\n");
}

const dictionary = {
  en: {
    plant: "Plant",
    status: "Overall status",
    confidence: "Confidence score",
    whatISee: "What I see",
    likelyIssue: "Likely issue",
    secondary: "Secondary possibility",
    validated: "Validated against expert guidance",
    crossChecked: "Cross-checked against trusted plant expert sources",
    freshness: "Freshness",
    bestSupported: "Best-supported issue after live validation",
    validationStrength: "Validation strength",
    secondOpinion: "Second opinion",
    doNow: "What to do now",
    prevention: "Prevention",
    urgency: "Urgency",
    needMoreInfo: "Need more info",
    unclearIssue: "Unclear from this image",
    unknownPlant: "Unknown plant",
    photoGuide: [
      "To help me diagnose better, please send:",
      "1. one clear photo of the whole plant,",
      "2. one close-up of the damaged area,",
      "3. one photo of the soil and pot,",
      "in natural light if possible."
    ]
  },
  he: {
    plant: "צמח",
    status: "מצב כללי",
    confidence: "רמת ביטחון",
    whatISee: "מה אני רואה",
    likelyIssue: "הבעיה הסבירה",
    secondary: "אפשרות נוספת",
    validated: "אימות מול מקורות מומחים",
    crossChecked: "נבדק מול מקורות אמינים בתחום הצמחים",
    freshness: "עדכניות",
    bestSupported: "האבחנה שקיבלה את התמיכה החזקה ביותר",
    validationStrength: "עוצמת האימות",
    secondOpinion: "חוות דעת נוספת",
    doNow: "מה לעשות עכשיו",
    prevention: "מניעה",
    urgency: "דחיפות",
    needMoreInfo: "כדי לדייק עוד",
    unclearIssue: "לא חד־משמעי מהתמונה הזו",
    unknownPlant: "צמח לא מזוהה",
    photoGuide: [
      "כדי שאוכל לדייק יותר, שלחו בבקשה:",
      "1. תמונה ברורה של כל הצמח,",
      "2. צילום תקריב של האזור הפגוע,",
      "3. תמונה של האדמה והעציץ,",
      "ועדיף באור טבעי."
    ]
  }
} as const;

function statusLabel(status: HealthStatus, language: ReplyLanguage) {
  const en = { healthy: "Healthy", mild_stress: "Mild stress", moderate_issue: "Moderate issue", severe_issue: "Severe issue", unclear: "Unclear" };
  const he = { healthy: "בריא", mild_stress: "סטרס קל", moderate_issue: "בעיה בינונית", severe_issue: "בעיה חמורה", unclear: "לא ברור" };
  return (language === "he" ? he : en)[status];
}

function urgencyLabel(status: HealthStatus, language: ReplyLanguage) {
  const level = status === "severe_issue" ? "high" : status === "moderate_issue" ? "medium" : "low";
  const labels = language === "he" ? { high: "גבוהה", medium: "בינונית", low: "נמוכה" } : { high: "High", medium: "Medium", low: "Low" };
  return labels[level];
}

function validationLabel(value: ValidationStrength, language: ReplyLanguage) {
  const en = { strong: "strong", partial: "partial", weak: "weak", conflicting: "conflicting", unavailable: "unavailable" };
  const he = { strong: "חזק", partial: "חלקי", weak: "חלש", conflicting: "סותר", unavailable: "לא זמין" };
  return (language === "he" ? he : en)[value];
}

function freshnessLabel(value: "live" | "cached" | "unknown", language: ReplyLanguage) {
  const en = { live: "live", cached: "cached", unknown: "unknown" };
  const he = { live: "חי", cached: "מטמון", unknown: "לא ידוע" };
  return (language === "he" ? he : en)[value];
}

function confidenceReason(score: number, language: ReplyLanguage) {
  if (language === "he") {
    if (score >= 9) return "— ביטחון גבוה מאוד";
    if (score >= 7) return "— כנראה נכון אבל יש מעט אי־ודאות";
    if (score >= 5) return "— נדרש עוד מידע כדי לדייק";
    return "— ביטחון נמוך, צריך עוד תמונות או מידע";
  }
  if (score >= 9) return "— very high confidence";
  if (score >= 7) return "— likely correct with some uncertainty";
  if (score >= 5) return "— more information would help";
  return "— low confidence, needs more evidence";
}
