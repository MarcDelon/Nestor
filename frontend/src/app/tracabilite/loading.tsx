export default function TracabiliteLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#F7F4EE 0%,#EDE9DF 100%)", fontFamily: "var(--font-body,'DM Sans',sans-serif)" }}>
      {/* Header skeleton */}
      <header style={{ position: "sticky", top: 0, background: "rgba(247,244,238,0.94)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(230,225,214,0.7)", padding: "14px 40px", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 24 }}>
          {[70, 56, 72, 58].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 14, borderRadius: 6 }} />)}
        </div>
        <div className="skeleton" style={{ width: 88, height: 36, borderRadius: 99 }} />
      </header>

      {/* Hero skeleton */}
      <section style={{ background: "linear-gradient(135deg,#071A0E,#0A2F1D)", padding: "56px 40px 52px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="skeleton" style={{ width: 44, height: 3, borderRadius: 99, marginBottom: 18, opacity: 0.3 }} />
          <div className="skeleton" style={{ width: 380, height: 40, borderRadius: 8, marginBottom: 14, opacity: 0.25 }} />
          <div className="skeleton" style={{ width: 520, height: 16, borderRadius: 6, marginBottom: 32, opacity: 0.2 }} />

          {/* Search input skeleton */}
          <div className="skeleton" style={{ width: "100%", maxWidth: 680, height: 56, borderRadius: 99, opacity: 0.2 }} />
        </div>
      </section>

      {/* Content skeleton */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "48px 32px" }}>
        {/* How it works grid */}
        <div className="skeleton" style={{ width: 220, height: 24, borderRadius: 6, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 18 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", border: "1px solid #E6E1D6" }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: "70%", height: 14, borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "100%", height: 11, borderRadius: 6, marginBottom: 5 }} />
              <div className="skeleton" style={{ width: "80%", height: 11, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
