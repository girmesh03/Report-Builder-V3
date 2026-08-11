/**
 * @module mock/fixtures
 *
 * §66.10 adapter fixture data — the §40 fixture contract scoped to
 * the P3 auth surface (the adapter extends to the domain fixtures
 * with its owning phases). Mirrors §25.3: the sample persona
 * `ቤዛ አያሌው` (profile name per §6.8) with a schema-valid account,
 * plus a second user so ownership scoping (BR-13) is exercisable.
 * No mock user carries a real email or password material — password
 * material follows the §28 account-creation contract (≥ 8 chars).
 *
 * This is a **phase artifact** (§66.10): dev-only data, deleted with
 * the adapter at P7 — never a runtime feature.
 */

/**
 * Demo credentials (adapter fixture data, shown at the step-5
 * review): persona `ቤዛ አያሌው` / beza.ayalew@gmail.com and the second
 * BR-13 user. Emails derive the profile name per §19.2.
 * @type {readonly Object[]}
 */
export const MOCK_USERS = Object.freeze([
  Object.freeze({
    _id: "mock-0001",
    email: "beza.ayalew@gmail.com",
    password: "password123",
    firstName: "Beza",
    lastName: "Ayalew",
    fullName: "Beza Ayalew",
    avatar: "",
    position: "Supervisor",
  }),
  Object.freeze({
    _id: "mock-0002",
    email: "henok.getnet@gmail.com",
    password: "password123",
    firstName: "Henok",
    lastName: "Getnet",
    fullName: "Henok Getnet",
    avatar: "",
    position: "Supervisor",
  }),
]);

/**
 * Adapter behaviour knobs (fixture data, documented): a short latency
 * so loading states and the §42.3 chain are observable in the
 * exit-gate walk; the access token expires after 30s so the reauth
 * walk is practical; the refresh token outlives it by far (session
 * continuity per §28.2).
 * @type {readonly Object<string, number>}
 */
export const MOCK_ADAPTER = Object.freeze({
  latencyMs: 250,
  accessTokenTtlMs: 30000,
  refreshTokenTtlMs: 3600000,
});
