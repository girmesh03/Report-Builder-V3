/**
 * @module mock/transport
 *
 * The §66.10 development mock adapter: a plain client module (no
 * package) implementing the §42 query contracts over §40 fixture
 * data. It mirrors the §17/§27 DTO and envelope transforms exactly —
 * every response is the `{ success, message, data }` envelope of
 * §27.4 (or its error form with `details` for 422), and the
 * `UserDto` serialized surface of §19/§28 — so page code cannot tell
 * the adapter from the real API.
 *
 * Session model: the adapter simulates the §28 cookie session with
 * an in-memory active session (access + refresh tokens, §28.2 TTL
 * semantics); `POST /auth/refresh` rotates tokens and the access
 * token expires on its §28.2 window, exercising the §42.3 reauth
 * chain. It is wired dev-only at the §42 boundary (apiSlice.js) and
 * **never exists in a production build**; deleted at P7 (§66.10).
 */
import { MOCK_ADAPTER, MOCK_USERS } from "./fixtures";
import { httpStatus } from "../utils/httpStatus";

const { latencyMs, accessTokenTtlMs, refreshTokenTtlMs } = MOCK_ADAPTER;

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_TAKEN_MESSAGE = "This email is already registered";
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const GOOGLE_STUB_MESSAGE = "Google sign-in is not available in this version";

/** Mutable copies — the adapter is stateful, fixtures are the seed. */
const users = MOCK_USERS.map((user) => ({ ...user }));

/**
 * @typedef {Object} Session
 * @property {Object} access - `{ token, expiresAt }`.
 * @property {Object} refresh - `{ token, expiresAt }`.
 */
let activeSession = null;

const delay = () => new Promise((resolve) => setTimeout(resolve, latencyMs));

const randomToken = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const toUserDto = (user) => ({
  _id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  avatar: user.avatar,
  position: user.position,
});

const successEnvelope = (data, message = "OK") => ({ success: true, message, data });

const errorEnvelope = (message, details) => ({
  success: false,
  message,
  data: null,
  ...(details ? { details } : {}),
});

const findUser = (email) =>
  users.find((user) => user.email.toLowerCase() === email.toLowerCase());

const deriveName = (email) => {
  const local = email.split("@")[0];
  const [first, last = ""] = local.split(".");
  const capitalize = (part) =>
    part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : "";
  return { firstName: capitalize(first), lastName: capitalize(last) };
};

const startSession = () => {
  const session = {
    access: { token: randomToken("acc"), expiresAt: Date.now() + accessTokenTtlMs },
    refresh: { token: randomToken("ref"), expiresAt: Date.now() + refreshTokenTtlMs },
  };
  activeSession = session;
  return session;
};

const rotateSession = () => {
  const rotated = {
    access: { token: randomToken("acc"), expiresAt: Date.now() + accessTokenTtlMs },
    refresh: { token: randomToken("ref"), expiresAt: Date.now() + refreshTokenTtlMs },
  };
  activeSession = rotated;
  return rotated;
};

const sessionUser = () => {
  if (!activeSession) {
    return null;
  }
  if (Date.now() > activeSession.access.expiresAt) {
    return null;
  }
  return users.find((user) => user._id === activeSession.userId) ?? null;
};

const handlers = {
  "POST /auth/register": (body = {}) => {
    const { email, password } = body;
    const details = [];
    if (!email || !EMAIL_REGEX.test(email)) {
      details.push({ field: "email", message: "Enter a valid email address" });
    }
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      details.push({
        field: "password",
        message: "Password must be at least 8 characters",
      });
    }
    if (details.length) {
      return { error: { status: httpStatus.UNPROCESSABLE_ENTITY, data: errorEnvelope("Check the highlighted fields", details) } };
    }
    if (findUser(email)) {
      return { error: { status: httpStatus.CONFLICT, data: errorEnvelope(EMAIL_TAKEN_MESSAGE) } };
    }
    const { firstName, lastName } = deriveName(email);
    const user = {
      _id: `mock-${String(users.length + 1).padStart(4, "0")}`,
      email,
      password,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      avatar: "",
      position: "Supervisor",
    };
    users.push(user);
    return { data: successEnvelope({ user: toUserDto(user) }, "Account created") };
  },

  "POST /auth/login": (body = {}) => {
    const { email, password } = body;
    const user = findUser(email ?? "");
    if (!user || user.password !== password) {
      return {
        error: {
          status: httpStatus.UNAUTHORIZED,
          data: errorEnvelope(INVALID_CREDENTIALS_MESSAGE),
        },
      };
    }
    activeSession = { ...startSession(), userId: user._id };
    return { data: successEnvelope({ user: toUserDto(user) }, "Logged in") };
  },

  "POST /auth/refresh": () => {
    if (!activeSession || Date.now() > activeSession.refresh.expiresAt) {
      return {
        error: {
          status: httpStatus.UNAUTHORIZED,
          data: errorEnvelope("Session expired"),
        },
      };
    }
    const user = users.find((entry) => entry._id === activeSession.userId);
    if (!user) {
      return {
        error: {
          status: httpStatus.UNAUTHORIZED,
          data: errorEnvelope("Session expired"),
        },
      };
    }
    activeSession = { ...rotateSession(), userId: user._id };
    return { data: successEnvelope({ user: toUserDto(user) }, "Session refreshed") };
  },

  "POST /auth/logout": () => {
    activeSession = null;
    return { data: successEnvelope(null, "Logged out") };
  },

  "GET /auth/me": () => {
    const user = sessionUser();
    if (!user) {
      return {
        error: {
          status: httpStatus.UNAUTHORIZED,
          data: errorEnvelope("Session expired"),
        },
      };
    }
    return { data: successEnvelope({ user: toUserDto(user) }, "OK") };
  },

  "GET /auth/google": () => {
    return {
      error: { status: httpStatus.NOT_FOUND, data: errorEnvelope(GOOGLE_STUB_MESSAGE) },
    };
  },
};

/**
 * The mock transport — fetchBaseQuery-shaped: resolves to
 * `{ data: envelope }` on success or `{ error: { status, data:
 * envelope } }` on failure, mirroring the real transport's result
 * surface so the §42.3 chain and §42.4 normalization run unchanged.
 *
 * @param {{url?: string, method?: string, body?: Object, params?: Object}} args - Request args.
 * @returns {Promise<{data?: Object}|{error?: {status: number, data: Object}}>} Result.
 */
export const mockTransport = async (args) => {
  await delay();
  const method = (args.method ?? "GET").toUpperCase();
  const url = args.url ?? "";
  const handler = handlers[`${method} ${url}`];
  if (!handler) {
    return {
      error: {
        status: httpStatus.NOT_FOUND,
        data: errorEnvelope("Route not found"),
      },
    };
  }
  return handler(args.body ?? {});
};
