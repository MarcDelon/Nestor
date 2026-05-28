export default function AgencesLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-cream, #F7F4EE)", fontFamily: "var(--font-body,'DM Sans',sans-serif)" }}>
      {/* Header skeleton */}
      <header style={{ position: "sticky", top: 0, background: "rgba(247,244,238,0.94)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(230,225,214,0.7)", padding: "14px 40px", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 24 }}>
          {[70, 56, 72, 58].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 14, borderRadius: 6 }} />)}
        </div>
        <div className="skeleton" style={{ width: 88, height: 36, borderRadius: 99 }} />
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 32px" }}>
        {/* Page title */}
        <div style={{ marginBottom: 36 }}>
          <div className="skeleton" style={{ width: 44, height: 3, borderRadius: 99, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: 340, height: 36, borderRadius: 8, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: 480, height: 16, borderRadius: 6 }} />
        </div>

        {/* Agency card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 22, border: "1.5px solid #E6E1D6", boxShadow: "0 8px 28px rgba(7,26,14,0.05)", overflow: "hidden" }}>
              {/* Card top stripe */}
              <div className="skeleton" style={{ height: 4 }} />
              <div style={{ padding: "22px 22px 20px" }}>
                {/* Logo + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="skeleton" style={{ width: "70%", height: 16, borderRadius: 6 }} />
                    <div className="skeleton" style={{ width: "45%", height: 12, borderRadius: 6 }} />
                  </div>
                </div>
                {/* Description lines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: "100%", height: 12, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: "85%", height: 12, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: "60%", height: 12, borderRadius: 6 }} />
                </div>
                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
                  <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
