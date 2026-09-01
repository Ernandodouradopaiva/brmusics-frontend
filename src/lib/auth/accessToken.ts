/** Tokens ficam apenas em cookies HttpOnly — sem sessionStorage/localStorage. */

export function getAccessToken(): string | null {
  return null;
}

export function setAccessToken(_token: string | null): void {
  // noop
}

export function clearAccessToken(): void {
  // noop
}
