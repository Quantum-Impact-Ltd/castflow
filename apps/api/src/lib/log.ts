// Centralised log helpers. Today: a scrubber that strips single-use auth
// tokens from access logs before they hit stdout. Logs end up in operator-
// accessible storage (Railway/Vercel/CloudWatch) — anything logged with a
// live token is a credential leak waiting to happen. (Audit H2.)

// Patterns we redact. Add more as new token surfaces appear.
const TOKEN_QUERY_RE = /([?&](?:token|t|code|verification|reset)=)([^&\s]+)/gi
// Defensive: anything that *looks* like /<route>/<long-opaque-string> on
// auth-adjacent paths. Keeps the route shape intact for ops dashboards.
const TOKEN_PATH_RE =
  /(\/(?:verify-email|reset-password|verify|callback)\/)([A-Za-z0-9_\-+/=]{20,})/g

export function scrubTokens(input: string): string {
  return input.replace(TOKEN_QUERY_RE, '$1<redacted>').replace(TOKEN_PATH_RE, '$1<redacted>')
}

/** PrintFunc compatible with hono/logger — wraps console with token-scrubbing. */
export function safeLog(message: string, ...rest: string[]): void {
  // eslint-disable-next-line no-console
  console.log(scrubTokens(message), ...rest.map(scrubTokens))
}
