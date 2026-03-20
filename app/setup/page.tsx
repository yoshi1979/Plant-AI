import { getSetupStatus } from "@/lib/setup-status";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const status = getSetupStatus();

  return (
    <main>
      <div className="card">
        <span className="badge">Deployment setup</span>
        <h1>Setup checklist</h1>
        <p>{status.passed}/{status.total} checks passing.</p>
        <p>{status.ready ? "Core deployment config looks ready." : "Some required deployment settings are still missing."}</p>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Check</th>
              <th>Status</th>
              <th>Value</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {status.checks.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.ok ? "OK" : "Missing"}</td>
                <td>{item.value ?? "—"}</td>
                <td>{item.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
