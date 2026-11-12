"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function loginWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      // localhost에서는 redirect가 Chrome 저장소 분리 때문에 로그인 결과를 못 가져옴
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        setError(null);
      } else {
        const message =
          err instanceof Error ? err.message : "로그인에 실패했습니다.";
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setError(null);
    setBusy(true);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "로그아웃에 실패했습니다.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return { user, loading, busy, error, loginWithGoogle, logout };
}
