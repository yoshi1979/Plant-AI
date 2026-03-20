import { listRecentCases } from "@/lib/repositories/cases";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cases = await listRecentCases();

  return (
    <main>
      <div className="card">
        <span className="badge">Admin dashboard</span>
        <h1>Plant diagnosis cases</h1>
        <p>Review users, conversations, diagnoses, validation evidence, and low-confidence cases.</p>
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
                <td>{item.whatsappNumber}</td>
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
