import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getCaseDetail } from "@/lib/repositories/cases";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  await requireAdminSession();
  const detail = await getCaseDetail(params.id);
  if (!detail) notFound();

  return (
    <main>
      <div className="card">
        <Link href="/admin">← Back to cases</Link>
        <h1>{detail.detectedPlantName ?? "Unknown plant"}</h1>
        <p>{detail.whatsappNumber} · {detail.healthStatus} · confidence {detail.confidenceScore}/10</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Diagnosis</h2>
          <p><strong>Primary issue:</strong> {detail.primaryIssue ?? "—"}</p>
          <p><strong>Validation:</strong> {detail.validationStrength}</p>
          <p>{detail.validationSummary ?? "No summary available."}</p>
          <h3>Observed symptoms</h3>
          <ul>{detail.observedSymptoms.map((x) => <li key={x}>{x}</li>)}</ul>
          <h3>Prevention</h3>
          <ul>{detail.preventionTips.map((x) => <li key={x}>{x}</li>)}</ul>
          {detail.escalationAdvice ? <p><strong>Escalation:</strong> {detail.escalationAdvice}</p> : null}
        </div>
        <div className="card">
          <h2>Override diagnosis</h2>
          <form action={`/admin/cases/${detail.id}/override`} method="post" className="grid">
            <input name="primaryIssue" defaultValue={detail.primaryIssue ?? ""} placeholder="Primary issue" style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#0b1220", color: "white" }} />
            <input name="healthStatus" defaultValue={detail.healthStatus} placeholder="Health status" style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#0b1220", color: "white" }} />
            <input name="confidenceScore" type="number" min="1" max="10" defaultValue={detail.confidenceScore} style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#0b1220", color: "white" }} />
            <textarea name="validationSummary" defaultValue={detail.validationSummary ?? ""} rows={4} style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#0b1220", color: "white" }} />
            <button type="submit" style={{ padding: 12, borderRadius: 12, border: 0, background: "#22c55e", color: "#04110a", fontWeight: 700 }}>Save override</button>
          </form>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Expert validations</h2>
          <ul>
            {detail.expertValidations.map((x) => (
              <li key={x.sourceUrl}><a href={x.sourceUrl} target="_blank">{x.sourceTitle}</a> — {x.sourceType}</li>
            ))}
          </ul>
          <h2>Treatment recommendations</h2>
          <ol>
            {detail.treatmentRecommendations.map((x) => <li key={`${x.priority}-${x.action}`}>{x.action} {x.why ? `— ${x.why}` : ""}</li>)}
          </ol>
        </div>
        <div className="card">
          <h2>Follow-up questions</h2>
          <ul>
            {detail.followUpQuestions.map((x) => <li key={x.question}>{x.question} {x.answered ? "✓" : ""}</li>)}
          </ul>
          <h2>Uploaded images</h2>
          <ul>
            {detail.uploadedImages.map((x) => <li key={x.storagePath}>{x.signedUrl ? <a href={x.signedUrl} target="_blank">Open image</a> : x.storagePath} ({x.mimeType ?? "unknown"})</li>)}
          </ul>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Conversation history</h2>
          <ul>
            {detail.messages.map((x, i) => <li key={`${x.createdAt}-${i}`}><strong>{x.direction}</strong> [{x.messageType}] {x.body ?? "(no text)"}</li>)}
          </ul>
        </div>
        <div className="card">
          <h2>Operator notes</h2>
          <form action={`/admin/cases/${detail.id}/note`} method="post" className="grid">
            <textarea name="note" rows={4} placeholder="Add operator note" style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#0b1220", color: "white" }} />
            <button type="submit" style={{ padding: 12, borderRadius: 12, border: 0, background: "#22c55e", color: "#04110a", fontWeight: 700 }}>Add note</button>
          </form>
          <ul>
            {detail.operatorNotes.map((x, i) => <li key={`${x.createdAt}-${i}`}>{x.note} <span className="badge">{x.eventType}</span></li>)}
          </ul>
        </div>
      </div>
    </main>
  );
}
