import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listRecentCases } from "@/lib/repositories/cases";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams?: { q?: string; unresolved?: string; maxConfidence?: string } }) {
  await requireAdminSession();
  const q = searchParams?.q;
  const unresolvedOnly = searchParams?.unresolved === "1";
  const maxConfidence = searchParams?.maxConfidence ? Number(searchParams.maxConfidence) : undefined;
  const cases = await listRecentCases({ search: q, unresolvedOnly, maxConfidence });

  return (
    <main>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <span className="badge">Admin dashboard</span>
          <h1>Plant diagnosis cases</h1>
          <p>Review users, conversations, diagnoses, validation evidence, and low-confidence cases.</p>
        </div>
        <form method="post" action="/api/admin/logout">
          <button type="submit" style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#111827", color: "white" }}>Log out</button>
        </form>
      </div>

      <div className="card">
        <form className="grid grid-2" method="get">
          <input name="q" defaultValue={q} placeholder="Search number, plant, or issue" style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#0b1220", color: "white" }} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <label><input type="checkbox" name="unresolved" value="1" defaultChecked={unresolvedOnly} /> unresolved only</label>
            <label>max confidence <input type="number" min="1" max="10" name="maxConfidence" defaultValue={maxConfidence} style={{ width: 72, marginLeft: 8 }} /></label>
            <button type="submit" style={{ padding: "10px 14px", borderRadius: 12, border: 0, background: "#22c55e", color: "#04110a", fontWeight: 700 }}>Filter</button>
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plant</th>
              <th>Status</th>
              <th>Issue</th>
              <th>Confidence</th>
              <th>Validation</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((item) => (
              <tr key={item.id}>
                <td><Link href={`/admin/cases/${item.id}`}>{item.whatsappNumber}</Link></td>
                <td>{item.detectedPlantName ?? "Unknown plant"}</td>
                <td>{item.healthStatus}</td>
                <td>{item.primaryIssue ?? "—"}</td>
                <td>{item.confidenceScore}/10</td>
                <td>{item.validationStrength}</td>
                <td>{new Date(item.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
