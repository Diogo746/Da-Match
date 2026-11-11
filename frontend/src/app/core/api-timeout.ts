// Covers a cold Java container and the CSRF/authentication round trips.
// A timeout still leaves an already sent write unconfirmed; never replay it.
export const API_REQUEST_TIMEOUT_MS = 45_000;
