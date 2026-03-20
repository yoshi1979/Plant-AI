export default function HomePage() {
  return (
    <main>
      <div className="card">
        <span className="badge">Production-ready scaffold</span>
        <h1>Plant Health Assistant</h1>
        <p>
          WhatsApp-first AI plant diagnosis app with evidence-backed validation,
          confidence scoring, case history, and an admin dashboard.
        </p>
        <p>
          Start with <code>/api/webhooks/whatsapp</code> for inbound messages and <code>/admin</code> for review.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Core flow</h2>
          <ol>
            <li>Receive WhatsApp image</li>
            <li>Analyze plant and visible symptoms</li>
            <li>Generate candidate diagnoses</li>
            <li>Validate against trusted horticulture sources</li>
            <li>Return WhatsApp-friendly guidance</li>
            <li>Persist case for follow-up</li>
          </ol>
        </div>
        <div className="card">
          <h2>Key endpoints</h2>
          <ul>
            <li>GET /api/health</li>
            <li>GET/POST /api/webhooks/whatsapp</li>
            <li>GET /api/admin/cases</li>
            <li>GET /admin</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
