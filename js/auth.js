/**
 * Authentication and Session Management
 */
const AUTH_KEY = "reno_user_session";

export function getSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function setSession(userData, passcode) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ ...userData, passcode }));
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "login.html";
}

export function requireAuth() {
  const session = getSession();
  if (!session || !session.passcode) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}
