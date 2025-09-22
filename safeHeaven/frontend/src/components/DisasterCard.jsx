import React from "react";

const STATUS_STYLES = {
  neutral: { bg: "#F9FAFB", border: "#E5E7EB", text: "#111827", chipBg:"#FFFFFF" },
  warning: { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", chipBg:"#FFFFFF" },
  critical:{ bg: "#FEE2E2", border: "#FCA5A5", text: "#991B1B", chipBg:"#FFFFFF" }
};
const ICONS = { earthquake: "🏚️", flood: "🌊", cyclone: "🌪️", tsunami: "🌊" };
const row = { display:"flex", justifyContent:"space-between", alignItems:"center" };
const displayValue = (v) => (v == null || v === "" ? "Data unavailable" : v);

const DisasterCard = ({ type, title, coords, data, status="neutral", onViewDetails }) => {
  const styl = STATUS_STYLES[status] || STATUS_STYLES.neutral;
  return (
    <div
      style={{
        background: styl.bg,
        border: `1px solid ${styl.border}`,
        color: styl.text,
        borderRadius: 12,
        padding: 16,
        minWidth: 280,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}
    >
      <div style={row}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{ICONS[type]} {title}</div>
        <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: styl.chipBg, border: `1px solid ${styl.border}` }}>
          {status.toUpperCase()}
        </span>
      </div>

      <div style={{ fontSize: 12, marginTop: 8, color: "#6B7280" }}>
        Lat {coords?.latitude?.toFixed?.(2)}, Lng {coords?.longitude?.toFixed?.(2)}
      </div>

      <div style={{ marginTop: 12, background: "#FFFFFF", borderRadius: 8, padding: 12, border: `1px dashed ${styl.border}` }}>
        {data?.lines?.length
          ? data.lines.map((l, i) => (
              <div key={i} style={{ fontSize: 13, margin: "6px 0" }}>
                {l.label}: <span style={{ fontWeight: 700 }}>{displayValue(l.value)}</span>
              </div>
            ))
          : <div style={{ fontSize: 13, opacity: 0.7 }}>No data</div>}
      </div>

      {data?.note ? (
        <div style={{ fontSize: 12, marginTop: 8, color: "#6B7280" }}>Note: {data.note}</div>
      ) : null}

      <div style={{ ...row, marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#6B7280" }}>
          Updated: {data?.updatedAt || "-"}
        </div>
        <button
          onClick={onViewDetails}
          style={{
            fontSize: 12, padding: "8px 12px", borderRadius: 8, border: "none",
            cursor: "pointer", background: styl.text, color: "#FFFFFF"
          }}
        >
          View details
        </button>
      </div>
    </div>
  );
};

export default DisasterCard;
