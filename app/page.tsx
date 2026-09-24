export default function FoundationPage() {
  return (
    <main>
      <p className="eyebrow">Production application foundation</p>
      <h1>Stagenum</h1>
      <p className="tagline">Make every stage count.</p>
      <p>
        The production runtime is being built independently from the synthetic
        research prototype. No customer workflow or real payment processing is
        enabled here yet.
      </p>
      <dl>
        <div>
          <dt>Process health</dt>
          <dd><code>/api/health/live</code></dd>
        </div>
        <div>
          <dt>Dependency readiness</dt>
          <dd><code>/api/health/ready</code></dd>
        </div>
      </dl>
    </main>
  );
}
