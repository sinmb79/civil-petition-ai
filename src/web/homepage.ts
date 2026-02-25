export function renderHomepage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Civil Petition AI</title>
  <style>
    :root {
      --bg-0: #f3f7f4;
      --bg-1: #dce9e1;
      --ink: #0f2a22;
      --muted: #35544a;
      --accent: #126f52;
      --card: rgba(255, 255, 255, 0.82);
      --border: rgba(18, 111, 82, 0.22);
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at 10% 15%, #ffffff 0%, rgba(255,255,255,0) 40%),
        radial-gradient(circle at 90% 85%, #e3efe8 0%, rgba(227,239,232,0) 46%),
        linear-gradient(145deg, var(--bg-0), var(--bg-1));
      display: grid;
      place-items: center;
      padding: 24px;
    }

    .shell {
      width: min(980px, 100%);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: 0 24px 60px rgba(16, 48, 38, 0.15);
      overflow: hidden;
    }

    .hero {
      padding: 28px 26px 18px;
      border-bottom: 1px solid var(--border);
    }

    .eyebrow {
      font-size: 12px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 8px;
    }

    h1 {
      margin: 0;
      font-size: clamp(30px, 5vw, 52px);
      line-height: 1.05;
      color: var(--ink);
    }

    .sub {
      margin-top: 12px;
      font-size: 17px;
      line-height: 1.5;
      color: var(--muted);
      max-width: 760px;
    }

    .grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 22px 22px 26px;
    }

    .card {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      background: #fff;
    }

    .card h2 {
      margin: 0 0 8px;
      font-size: 18px;
      color: var(--accent);
    }

    .card p {
      margin: 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 14px;
    }

    .api {
      grid-column: 1 / -1;
      font-family: "Courier New", Courier, monospace;
      font-size: 13px;
      white-space: pre-wrap;
      color: #1f3d34;
      background: #f8fcfa;
    }

    @media (max-width: 760px) {
      .grid { grid-template-columns: 1fr; }
      .hero { padding: 22px 18px 14px; }
      .grid { padding: 16px 16px 20px; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Civil Petition Decision Support</p>
      <h1>Civil Petition AI</h1>
      <p class="sub">
        Structured draft generation, legal citation validation, audit-risk analysis, and asynchronous
        worker processing in one operational platform.
      </p>
    </section>
    <section class="grid">
      <article class="card">
        <h2>Generation Pipeline</h2>
        <p>DraftEngine with schema enforcement, validator pipeline, and repair/fallback behavior.</p>
      </article>
      <article class="card">
        <h2>Async Job Queue</h2>
        <p>DB-backed queue with worker claim/complete APIs and TTL cleanup support.</p>
      </article>
      <article class="card">
        <h2>Operational Guardrails</h2>
        <p>Beta gate, worker token auth, metrics endpoint, and standardized error responses.</p>
      </article>
      <article class="card">
        <h2>Audit & Compliance</h2>
        <p>Citation allowlist, PII detection/masking, and deterministic risk-level scoring.</p>
      </article>
      <article class="card api">GET  /health
GET  /metrics
POST /api/generate
GET  /api/jobs/:id
POST /api/worker/claim
POST /api/worker/complete</article>
    </section>
  </main>
</body>
</html>`;
}
