/**
 * @module pages/Login
 *
 * Interim placeholder for the §48.3 Login page — replaced by the
 * full implementation (LoginForm + OAuth entry + sign-up link) in
 * the P3 auth-pages task (§66.9 P3).
 */

export function Component() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: 8,
        fontFamily: "Inter, sans-serif",
        color: "text.secondary",
      }}
    >
      <h1 style={{ margin: 0, fontWeight: 600 }}>Log in</h1>
      <p style={{ margin: 0 }}>§48.3 — interim placeholder, full page in the P3 auth-pages task</p>
    </div>
  );
}

export default Component;
