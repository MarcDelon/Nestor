export default function LocationLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#F7F4EE 0%,#EDE9DF 100%)", fontFamily: "var(--font-body,'DM Sans',sans-serif)" }}>
      {/* Header skeleton */}
      <header style={{ position: "sticky", top: 0, background: "rgba(247,244,238,0.94)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(230,225,214,0.7)", padding: "14px 24px", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 24 }}>
          {[70, 56, 72, 58].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 14, borderRadius: 6 }} />)}
        </div>
        <div className="skeleton" style={{ width: 88, height: 36, borderRadius: 99 }} />
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px" }}>
        {/* Hero title skeleton */}
        <div style={{ marginBottom: 36 }}>
          <div className="skeleton" style={{ width: 44, height: 3, borderRadius: 99, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: 420, height: 44, borderRadius: 8, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: 300, height: 36, borderRadius: 8, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: 520, height: 16, borderRadius: 6 }} />
        </div>

        {/* Pricing tabs skeleton */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22, background: "rgba(10,47,29,0.05)", borderRadius: 30, padding: 3, width: "fit-content" }}>
          {[96, 80, 96].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 32, borderRadius: 28 }} />)}
        </div>

        {/* Bus type tabs skeleton */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {[80, 100, 88, 96, 112, 110].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 36, borderRadius: 30 }} />)}
        </div>

        {/* Usage filter skeleton */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {[88, 130, 148, 136, 90, 116].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 32, borderRadius: 30 }} />)}
        </div>

        {/* Bus grid skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 22, border: "1.5px solid #E6E1D6", overflow: "hidden", boxShadow: "0 8px 28px rgba(7,26,14,0.05)" }}>
              {/* Accent stripe */}
              <div className="skeleton" style={{ height: 4 }} />
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 99 }} />
                    <div className="skeleton" style={{ width: "75%", height: 18, borderRadius: 6 }} />
                  </div>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />
                </div>
                {/* Rating + badges */}
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="skeleton" style={{ width: 100, height: 18, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: 72, height: 18, borderRadius: 99 }} />
                </div>
                {/* Description */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div className="skeleton" style={{ width: "100%", height: 12, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: "85%", height: 12, borderRadius: 6 }} />
                  <div className="skeleton" style={{ width: "65%", height: 12, borderRadius: 6 }} />
                </div>
                {/* Amenities */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[60, 72, 80, 56, 68].map((w, j) => <div key={j} className="skeleton" style={{ width: w, height: 26, borderRadius: 8 }} />)}
                </div>
                {/* Price + CTA */}
                <div style={{ borderTop: "1px solid #f7fafc", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div className="skeleton" style={{ width: 60, height: 11, borderRadius: 6 }} />
                    <div className="skeleton" style={{ width: 120, height: 22, borderRadius: 6 }} />
                  </div>
                  <div className="skeleton" style={{ width: 130, height: 40, borderRadius: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
