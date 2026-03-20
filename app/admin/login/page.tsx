export default function AdminLoginPage() {
  return (
    <main>
      <div className="card" style={{ maxWidth: 480, margin: "48px auto" }}>
        <span className="badge">Admin login</span>
        <h1>Operator access</h1>
        <p>Enter the admin API key to access the case review dashboard.</p>
        <form method="post" action="/api/admin/login" className="grid">
          <label>
            <div style={{ marginBottom: 8 }}>Admin key</div>
            <input name="key" type="password" required style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "#0b1220", color: "white" }} />
          </label>
          <button type="submit" style={{ padding: 12, borderRadius: 12, border: 0, background: "#22c55e", color: "#04110a", fontWeight: 700 }}>Sign in</button>
        </form>
      </div>
    </main>
  );
}
