export default function ReserverLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-cream, #F7F4EE)", fontFamily: "var(--font-body,'DM Sans',sans-serif)" }}>
      {/* Header skeleton */}
      <header style={{ position: "fixed", top: 0, left: 0, width: "100%", background: "rgba(247,244,238,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(230,225,214,0.7)", padding: "14px 40px", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[70, 56, 72, 58].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 14, borderRadius: 6 }} />)}
        </div>
        <div className="skeleton" style={{ width: 88, height: 36, borderRadius: 99 }} />
      </header>

      <div style={{ paddingTop: 72, display: "flex" }}>
        {/* Sidebar skeleton */}
        <aside style={{ width: 320, minHeight: "calc(100vh - 72px)", background: "#0A2F1D", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ width: "80%", height: 16, borderRadius: 6, opacity: 0.25 }} />
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4, opacity: 0.15 }} />
              <div className="skeleton" style={{ width: `${50 + i * 8}%`, height: 12, borderRadius: 6, opacity: 0.15 }} />
            </div>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width: "100%", height: 13, borderRadius: 6, opacity: 0.12 }} />)}
          </div>
        </aside>

        {/* Main content skeleton */}
        <main style={{ flex: 1, padding: "28px 32px", maxWidth: 900 }}>
          {/* Journey cards */}
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #E6E1D6", padding: "20px 22px", marginBottom: 18, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 16px rgba(7,26,14,0.04)" }}>
              {/* Time block */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 80 }}>
                <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 44, height: 12, borderRadius: 6 }} />
              </div>
              {/* Duration line */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div className="skeleton" style={{ width: "80%", height: 3, borderRadius: 99 }} />
                <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 6 }} />
              </div>
              {/* Destination time */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 80 }}>
                <div className="skeleton" style={{ width: 64, height: 22, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 44, height: 12, borderRadius: 6 }} />
              </div>
              {/* Agency + price */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", minWidth: 120 }}>
                <div className="skeleton" style={{ width: 80, height: 16, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 100, height: 28, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
