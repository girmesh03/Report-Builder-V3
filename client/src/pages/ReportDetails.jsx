/**
 * @module pages/ReportDetails
 *
 * Interim placeholder for the §51 Report Details page —
 * replaced by the full implementation in the P4 pages phase (§66.9
 * P4). Renders inside AppShell's scrollable Outlet.
 */

export function Component() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 8,
        fontFamily: "Inter, sans-serif",
        color: "text.secondary",
      }}
    >
      <h1 style={{ margin: 0, fontWeight: 600 }}>Report details</h1>
      <p style={{ margin: 0 }}>§51 — interim placeholder, full page in the P4 pages phase</p>
    </div>
  );
}

export default Component;
