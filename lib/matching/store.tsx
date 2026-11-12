"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabase } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_EMOJI } from "./categories";
import {
  deleteMatchingPost,
  fetchMatchingBoard,
  insertMatchingMessage,
  insertMatchingPost,
  rowToMessage,
  rowToPost,
  updateMatchingPost,
} from "./remote";
import {
  DEADLINE_MINUTES,
  isUntilDeleted,
  remainingMinutes,
  type AlertPrefs,
  type CategoryId,
  type ChatMessage,
  type CreateDraft,
  type MatchingPost,
  type MeetingPlace,
  type PushNotification,
} from "./types";

const PREFS_KEY = "shinwon-half-prefs";

const EMPTY_ALERTS: AlertPrefs = {
  categories: [],
  keywords: [],
};

interface PersistedPrefs {
  alerts: AlertPrefs;
  unreadChatPostIds: string[];
  pushNotifications: PushNotification[];
}

export interface MatchingViewer {
  id: string;
  name: string;
}

interface MatchingStoreValue {
  ready: boolean;
  viewer: MatchingViewer | null;
  authLoading: boolean;
  authBusy: boolean;
  authError: string | null;
  loadError: string | null;
  loginWithGoogle: () => Promise<void>;
  now: number;
  posts: MatchingPost[];
  openPosts: MatchingPost[];
  myActivePosts: MatchingPost[];
  myInProgressPosts: MatchingPost[];
  myOpenPosts: MatchingPost[];
  myPastPosts: MatchingPost[];
  alerts: AlertPrefs;
  alertCount: number;
  pushNotifications: PushNotification[];
  unreadPushCount: number;
  chatNotifyCount: number;
  getPost: (id: string) => MatchingPost | undefined;
  getMessages: (postId: string) => ChatMessage[];
  hasIncomingChat: (postId: string) => boolean;
  isChatUnread: (postId: string) => boolean;
  markChatRead: (postId: string) => void;
  markPushRead: (id: string) => void;
  markAllPushRead: () => void;
  createPost: (draft: CreateDraft) => Promise<MatchingPost>;
  updatePost: (postId: string, draft: CreateDraft) => Promise<MatchingPost | undefined>;
  deletePost: (postId: string) => Promise<void>;
  sendMessage: (postId: string, text: string) => Promise<void>;
  confirmMatch: (postId: string) => Promise<void>;
  completeTrade: (postId: string) => Promise<void>;
  joinSeat: (postId: string) => void;
  toggleAlertCategory: (category: Exclude<CategoryId, "all">) => void;
  addAlertKeyword: (keyword: string) => void;
  removeAlertKeyword: (keyword: string) => void;
}

const MatchingStoreContext = createContext<MatchingStoreValue | null>(null);

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function categoryLabel(id: Exclude<CategoryId, "all">) {
  return CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

/** Own posts never create push alerts. */
function matchAlertReason(post: MatchingPost, alerts: AlertPrefs, userId: string | null) {
  if (!userId || post.authorId === userId) return null;

  if (alerts.categories.includes(post.category)) {
    return `카테고리 · ${categoryLabel(post.category)}`;
  }

  const haystack = `${post.itemName} ${post.menuName} ${post.storeName}`.toLowerCase();
  for (const keyword of alerts.keywords) {
    if (haystack.includes(keyword.toLowerCase())) {
      return `검색어 · ${keyword}`;
    }
  }
  return null;
}

function buildPushNotification(
  post: MatchingPost,
  reason: string,
): PushNotification {
  return {
    id: createId("push"),
    postId: post.id,
    title: `${post.itemName} 반띵 글이 올라왔어요`,
    body: `${post.storeName} · ${post.authorName}`,
    reason,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

function isStillListed(post: MatchingPost, now: number) {
  return remainingMinutes(post.deadlineMinutes, post.createdAt, now) > 0;
}

function isMine(post: MatchingPost, userId: string | null) {
  if (!userId) return false;
  return post.authorId === userId || post.participantIds.includes(userId);
}

function prefsKey(userId: string | null) {
  return `${PREFS_KEY}-${userId ?? "guest"}`;
}

function loadPrefs(userId: string | null): PersistedPrefs {
  try {
    const raw = window.localStorage.getItem(prefsKey(userId));
    if (!raw) {
      return { alerts: EMPTY_ALERTS, unreadChatPostIds: [], pushNotifications: [] };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
    return {
      alerts: {
        categories: parsed.alerts?.categories ?? [],
        keywords: parsed.alerts?.keywords ?? [],
      },
      unreadChatPostIds: Array.isArray(parsed.unreadChatPostIds)
        ? parsed.unreadChatPostIds
        : [],
      pushNotifications: Array.isArray(parsed.pushNotifications)
        ? parsed.pushNotifications
        : [],
    };
  } catch {
    return { alerts: EMPTY_ALERTS, unreadChatPostIds: [], pushNotifications: [] };
  }
}

function upsertById<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index < 0) return [item, ...list];
  const next = list.slice();
  next[index] = item;
  return next;
}

export function MatchingStoreProvider({ children }: { children: ReactNode }) {
  const {
    user,
    loading: authLoading,
    busy: authBusy,
    error: authError,
    loginWithGoogle,
  } = useAuth();
  const viewer = useMemo<MatchingViewer | null>(() => {
    if (!user) return null;
    const name = user.displayName?.trim() || user.email?.split("@")[0] || "이웃";
    return { id: user.uid, name };
  }, [user]);
  const viewerRef = useRef(viewer);
  viewerRef.current = viewer;
  const postsRef = useRef<MatchingPost[]>([]);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [posts, setPosts] = useState<MatchingPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [alerts, setAlerts] = useState<AlertPrefs>(EMPTY_ALERTS);
  const [unreadChatPostIds, setUnreadChatPostIds] = useState<string[]>([]);
  const [pushNotifications, setPushNotifications] = useState<PushNotification[]>(
    [],
  );

  postsRef.current = posts;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const prefs = loadPrefs(viewer?.id ?? null);
    setAlerts(prefs.alerts);
    setUnreadChatPostIds(prefs.unreadChatPostIds);
    setPushNotifications(prefs.pushNotifications);
  }, [authLoading, viewer?.id]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(
      prefsKey(viewer?.id ?? null),
      JSON.stringify({
        alerts,
        unreadChatPostIds,
        pushNotifications,
      } satisfies PersistedPrefs),
    );
  }, [ready, viewer?.id, alerts, unreadChatPostIds, pushNotifications]);

  useEffect(() => {
    if (authLoading) return;
    let stopped = false;
    const supabase = getSupabase();

    async function refresh() {
      try {
        const board = await fetchMatchingBoard();
        if (stopped) return;
        setPosts(board.posts);
        setMessages(board.messages);
        setLoadError(null);
      } catch (err) {
        if (stopped) return;
        const message = err instanceof Error ? err.message : "글을 불러오지 못했습니다.";
        setLoadError(
          message.includes("matching_posts")
            ? "반띵 글 저장 공간이 아직 없습니다. Supabase에 표를 만든 뒤 다시 열어 주세요."
            : message,
        );
      } finally {
        if (!stopped) {
          setNow(Date.now());
          setReady(true);
        }
      }
    }

    void refresh();
    if (!supabase) return () => {
      stopped = true;
    };

    const channel = supabase
      .channel("matching-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matching_posts" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = String((payload.old as { id?: string }).id ?? "");
            if (!id) return;
            setPosts((prev) => prev.filter((post) => post.id !== id));
            return;
          }
          const post = rowToPost(payload.new as Parameters<typeof rowToPost>[0]);
          setPosts((prev) => upsertById(prev, post));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matching_messages" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = String((payload.old as { id?: string }).id ?? "");
            if (!id) return;
            setMessages((prev) => prev.filter((message) => message.id !== id));
            return;
          }
          const message = rowToMessage(payload.new as Parameters<typeof rowToMessage>[0]);
          setMessages((prev) => upsertById(prev, message));
          const me = viewerRef.current;
          const post = postsRef.current.find((item) => item.id === message.postId);
          if (
            me &&
            post?.authorId === me.id &&
            message.senderId !== me.id &&
            message.senderId !== "system"
          ) {
            setUnreadChatPostIds((prev) =>
              prev.includes(message.postId) ? prev : [...prev, message.postId],
            );
          }
        },
      )
      .subscribe();

    const poll = window.setInterval(() => {
      void refresh();
    }, 15000);

    return () => {
      stopped = true;
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [authLoading]);

  useEffect(() => {
    if (!ready || !viewer) return;
    if (alerts.categories.length === 0 && alerts.keywords.length === 0) return;

    setPushNotifications((prev) => {
      const additions: PushNotification[] = [];
      for (const post of posts) {
        if (post.status !== "open") continue;
        if (post.authorId === viewer.id) continue;
        if (prev.some((item) => item.postId === post.id)) continue;
        if (additions.some((item) => item.postId === post.id)) continue;
        const reason = matchAlertReason(post, alerts, viewer.id);
        if (!reason) continue;
        additions.push(buildPushNotification(post, reason));
      }
      if (additions.length === 0) return prev;
      return [...additions, ...prev];
    });
  }, [ready, posts, alerts, viewer]);

  const openPosts = useMemo(() => {
    if (!ready || !now) return [];
    return posts
      .filter((post) => post.status === "open" && isStillListed(post, now))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [posts, ready, now]);

  const myInProgressPosts = useMemo(() => {
    if (!ready) return [];
    return posts
      .filter((post) => post.status === "matched" && isMine(post, viewer?.id ?? null))
      .sort((a, b) => {
        const aTime = new Date(a.matchedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.matchedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      });
  }, [posts, ready, viewer?.id]);

  const myOpenPosts = useMemo(() => {
    if (!ready || !now) return [];
    return posts
      .filter(
        (post) =>
          post.status === "open" &&
          isMine(post, viewer?.id ?? null) &&
          isStillListed(post, now),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [posts, ready, now, viewer?.id]);

  const myPastPosts = useMemo(() => {
    if (!ready || !now) return [];
    return posts
      .filter(
        (post) =>
          post.status === "open" &&
          isMine(post, viewer?.id ?? null) &&
          !isStillListed(post, now),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [posts, ready, now, viewer?.id]);

  const myActivePosts = useMemo(
    () => [...myInProgressPosts, ...myOpenPosts],
    [myInProgressPosts, myOpenPosts],
  );

  const alertCount = alerts.categories.length + alerts.keywords.length;

  const unreadPushCount = useMemo(
    () => pushNotifications.filter((item) => !item.read).length,
    [pushNotifications],
  );

  const chatNotifyCount = useMemo(
    () =>
      (unreadChatPostIds ?? []).filter((postId) =>
        posts.some(
          (post) =>
            post.id === postId &&
            post.authorId === viewer?.id &&
            post.status !== "completed",
        ),
      ).length,
    [unreadChatPostIds, posts, viewer?.id],
  );

  const getPost = useCallback(
    (id: string) => posts.find((post) => post.id === id),
    [posts],
  );

  const getMessages = useCallback(
    (postId: string) => {
      const seen = new Set<string>();
      return messages
        .filter((message) => {
          if (message.postId !== postId) return false;
          if (seen.has(message.id)) return false;
          seen.add(message.id);
          return true;
        })
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
    },
    [messages],
  );

  const hasIncomingChat = useCallback(
    (postId: string) =>
      messages.some(
        (message) =>
          message.postId === postId &&
          message.senderId !== viewer?.id &&
          message.senderId !== "system",
      ),
    [messages, viewer?.id],
  );

  const isChatUnread = useCallback(
    (postId: string) => (unreadChatPostIds ?? []).includes(postId),
    [unreadChatPostIds],
  );

  const markChatRead = useCallback((postId: string) => {
    setUnreadChatPostIds((prev) => (prev ?? []).filter((id) => id !== postId));
  }, []);

  const markPushRead = useCallback((id: string) => {
    setPushNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllPushRead = useCallback(() => {
    setPushNotifications((prev) =>
      prev.map((item) => (item.read ? item : { ...item, read: true })),
    );
  }, []);

  const requireViewer = () => {
    const current = viewerRef.current;
    if (!current) throw new Error("로그인 후 이용할 수 있습니다.");
    return current;
  };

  const createPost = useCallback(async (draft: CreateDraft) => {
    const actor = requireViewer();
    if (!draft.category) {
      throw new Error("카테고리를 선택해 주세요.");
    }

    const post: MatchingPost = {
      id: createId("post"),
      category: draft.category,
      itemName: draft.itemName.trim() || draft.menuName.trim(),
      storeName: draft.storeName.trim(),
      menuName: draft.menuName.trim(),
      totalPrice: draft.totalPrice,
      peopleNeeded: draft.peopleNeeded,
      peopleJoined: 1,
      deadlineMinutes: DEADLINE_MINUTES[draft.deadline],
      createdAt: new Date().toISOString(),
      meetingPlace: draft.meetingPlace,
      customPlace:
        draft.meetingPlace === "custom" ? draft.customPlace.trim() : undefined,
      note: draft.note.trim() || undefined,
      authorId: actor.id,
      authorName: actor.name,
      status: "open",
      imageEmoji: CATEGORY_EMOJI[draft.category],
      participantIds: [actor.id],
    };

    const saved = await insertMatchingPost(post);
    setPosts((prev) => upsertById(prev, saved));
    return saved;
  }, []);

  const updatePost = useCallback(async (postId: string, draft: CreateDraft) => {
    const actor = requireViewer();
    if (!draft.category) {
      throw new Error("카테고리를 선택해 주세요.");
    }
    const current = postsRef.current.find(
      (post) => post.id === postId && post.authorId === actor.id,
    );
    if (!current || current.status === "completed") return undefined;

    const next: MatchingPost = {
      ...current,
      category: draft.category,
      itemName: draft.itemName.trim() || draft.menuName.trim(),
      storeName: draft.storeName.trim(),
      menuName: draft.menuName.trim(),
      totalPrice: draft.totalPrice,
      peopleNeeded: Math.max(draft.peopleNeeded, current.peopleJoined),
      deadlineMinutes: DEADLINE_MINUTES[draft.deadline],
      meetingPlace: draft.meetingPlace,
      customPlace:
        draft.meetingPlace === "custom" ? draft.customPlace.trim() : undefined,
      note: draft.note.trim() || undefined,
      imageEmoji: CATEGORY_EMOJI[draft.category],
    };
    const saved = await updateMatchingPost(next);
    setPosts((prev) => upsertById(prev, saved));
    return saved;
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    const actor = requireViewer();
    const current = postsRef.current.find((post) => post.id === postId);
    if (!current || current.authorId !== actor.id) return;
    await deleteMatchingPost(postId);
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setMessages((prev) => prev.filter((message) => message.postId !== postId));
  }, []);

  const sendMessage = useCallback(async (postId: string, text: string) => {
    const actor = requireViewer();
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!postsRef.current.some((item) => item.id === postId)) return;

    const saved = await insertMatchingMessage({
      id: createId("msg"),
      postId,
      senderId: actor.id,
      senderName: actor.name,
      text: trimmed,
      createdAt: new Date().toISOString(),
    });
    setMessages((prev) => upsertById(prev, saved));
  }, []);

  const joinSeat = useCallback((_postId: string) => {
    // 자리 확정은 confirmMatch에서 한 번에 저장한다.
  }, []);

  const confirmMatch = useCallback(async (postId: string) => {
    const actor = requireViewer();
    const current = postsRef.current.find((post) => post.id === postId);
    if (!current || current.status !== "open") return;
    const participantIds = current.participantIds.includes(actor.id)
      ? current.participantIds
      : [...current.participantIds, actor.id];
    const next: MatchingPost = {
      ...current,
      status: "matched",
      peopleJoined: current.peopleNeeded,
      participantIds,
      matchedAt: new Date().toISOString(),
    };
    const saved = await updateMatchingPost(next);
    setPosts((prev) => upsertById(prev, saved));
    const system = await insertMatchingMessage({
      id: createId("msg-matched"),
      postId,
      senderId: "system",
      senderName: "시스템",
      text: "매칭이 확정되었습니다. 약속을 마치면 거래 완료로 바꿔 주세요.",
      createdAt: new Date().toISOString(),
    });
    setMessages((prev) => upsertById(prev, system));
  }, []);

  const completeTrade = useCallback(async (postId: string) => {
    const actor = requireViewer();
    const current = postsRef.current.find((post) => post.id === postId);
    if (!current || !isMine(current, actor.id) || current.status !== "matched") return;
    const saved = await updateMatchingPost({ ...current, status: "completed" });
    setPosts((prev) => upsertById(prev, saved));
  }, []);

  const toggleAlertCategory = useCallback(
    (category: Exclude<CategoryId, "all">) => {
      setAlerts((prev) => {
        const exists = prev.categories.includes(category);
        return {
          ...prev,
          categories: exists
            ? prev.categories.filter((item) => item !== category)
            : [...prev.categories, category],
        };
      });
    },
    [],
  );

  const addAlertKeyword = useCallback((keyword: string) => {
    const normalized = keyword.trim().replace(/\s+/g, " ");
    if (!normalized) return;
    setAlerts((prev) => {
      if (prev.keywords.includes(normalized)) return prev;
      return { ...prev, keywords: [...prev.keywords, normalized] };
    });
  }, []);

  const removeAlertKeyword = useCallback((keyword: string) => {
    setAlerts((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((item) => item !== keyword),
    }));
  }, []);

  const value = useMemo<MatchingStoreValue>(
    () => ({
      ready,
      viewer,
      authLoading,
      authBusy,
      authError,
      loadError,
      loginWithGoogle,
      now,
      posts,
      openPosts,
      myActivePosts,
      myInProgressPosts,
      myOpenPosts,
      myPastPosts,
      alerts,
      alertCount,
      pushNotifications,
      unreadPushCount,
      chatNotifyCount,
      getPost,
      getMessages,
      hasIncomingChat,
      isChatUnread,
      markChatRead,
      markPushRead,
      markAllPushRead,
      createPost,
      updatePost,
      deletePost,
      sendMessage,
      confirmMatch,
      completeTrade,
      joinSeat,
      toggleAlertCategory,
      addAlertKeyword,
      removeAlertKeyword,
    }),
    [
      ready,
      viewer,
      authLoading,
      authBusy,
      authError,
      loadError,
      loginWithGoogle,
      now,
      posts,
      openPosts,
      myActivePosts,
      myInProgressPosts,
      myOpenPosts,
      myPastPosts,
      alerts,
      alertCount,
      pushNotifications,
      unreadPushCount,
      chatNotifyCount,
      getPost,
      getMessages,
      hasIncomingChat,
      isChatUnread,
      markChatRead,
      markPushRead,
      markAllPushRead,
      createPost,
      updatePost,
      deletePost,
      sendMessage,
      confirmMatch,
      completeTrade,
      joinSeat,
      toggleAlertCategory,
      addAlertKeyword,
      removeAlertKeyword,
    ],
  );

  return (
    <MatchingStoreContext.Provider value={value}>
      {children}
    </MatchingStoreContext.Provider>
  );
}

export function useMatchingStore() {
  const context = useContext(MatchingStoreContext);
  if (!context) {
    throw new Error("useMatchingStore must be used within MatchingStoreProvider");
  }
  return context;
}

export function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function pricePerPerson(total: number, people: number) {
  if (people <= 0) return 0;
  return Math.round(total / people);
}

export function placeLabel(place: MeetingPlace, customPlace?: string) {
  if (place === "custom") return customPlace || "직접 입력";
  const map = {
    "store-front": "가게 앞",
    "main-gate": "신원시장 정문",
    "back-gate": "신원시장 후문",
    custom: "직접 입력",
  } as const;
  return map[place];
}

export function getRemainingLabel(post: MatchingPost, now: number) {
  if (isUntilDeleted(post.deadlineMinutes)) return "삭제 전까지";
  const left = remainingMinutes(post.deadlineMinutes, post.createdAt, now);
  if (!now) return "계산 중";
  if (left <= 0) return "마감";
  if (left < 60) return `${left}분 남음`;
  const hours = Math.floor(left / 60);
  const minutes = left % 60;
  return minutes === 0 ? `${hours}시간 남음` : `${hours}시간 ${minutes}분 남음`;
}

export function formatMatchedAt(value?: string) {
  if (!value) return "매칭 완료";
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} 매칭`;
}
