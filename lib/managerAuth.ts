export const MANAGER_PASSWORD = "manager.shinwon";
export const MANAGER_AUTH_KEY = "newone-manager-auth";

export function isManagerAuthed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(MANAGER_AUTH_KEY) === "1";
}

export function setManagerAuthed() {
  window.sessionStorage.setItem(MANAGER_AUTH_KEY, "1");
}

export function clearManagerAuthed() {
  window.sessionStorage.removeItem(MANAGER_AUTH_KEY);
}
