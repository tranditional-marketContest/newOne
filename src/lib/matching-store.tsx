"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CATEGORY_EMOJI } from "./categories";
import { createFreshSeedMessages, createFreshSeedPosts } from "./seed";
import {
  CURRENT_USER,
  DEADLINE_MINUTES,
  type AlertPrefs,
  type CategoryId,
  type ChatMessage,
  type CreateDraft,
  type MatchingPost,
  type MeetingPlace,
} from "./types";

const STORAGE_KEY = "shinwon-half-half-v3";

const EMPTY_ALERTS: AlertPrefs = {
  categories: [],
  keywords: [],
};

interface PersistedState {
  posts: MatchingPost[];
  messages: ChatMessage[];
  alerts: AlertPrefs;
  unreadChatPostIds: string[];
}

interface MatchingStoreValue {
  ready: boolean;
  now: number;
  posts: MatchingPost[];
  openPosts: MatchingPost[];
  myActivePosts: MatchingPost[];
  myInProgressPosts: MatchingPost[];
  myOpenPosts: MatchingPost[];
  alerts: AlertPrefs;
  alertCount: number;
  chatNotifyCount: number;
  getPost: (id: string) => MatchingPost | undefined;
  getMessages: (postId: string) => ChatMessage[];
  hasIncomingChat: (postId: string) => boolean;
  isChatUnread: (postId: string) => boolean;
  markChatRead: (postId: string) => void;
  createPost: (draft: CreateDraft) => MatchingPost;
  updatePost: (postId: string, draft: CreateDraft) => MatchingPost | undefined;
  deletePost: (postId: string) => void;
  sendMessage: (postId: string, text: string) => void;
  confirmMatch: (postId: string) => void;
  completeTrade: (postId: string) => void;
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

function remainingMinutes(post: MatchingPost, now: number) {
  if (!post.createdAt || !now) return post.deadlineMinutes;
  const elapsed = (now - new Date(post.createdAt).getTime()) / 60_000;
  return Math.max(0, Math.floor(post.deadlineMinutes - elapsed));
}

function isMine(post: MatchingPost) {
  return (
    post.authorId === CURRENT_USER.id ||
    post.participantIds.includes(CURRENT_USER.id)
  );
}

function normalizePost(post: MatchingPost): MatchingPost {
  const { discountLabel: _removed, ...rest } = post as MatchingPost & {
    discountLabel?: string;
  };
  return {
    ...rest,
    participantIds:
      rest.participantIds?.length > 0
        ? rest.participantIds
        : [rest.authorId],
  };
}

function ensureDemoPosts(posts: MatchingPost[]) {
  const fresh = createFreshSeedPosts();
  const next = [...posts];

  const ensure = (id: string) => {
    if (next.some((post) => post.id === id)) return;
    const sample = fresh.find((post) => post.id === id);
    if (sample) next.unshift(sample);
  };

  if (!next.some((post) => post.status === "matched" && isMine(post))) {
    ensure("post-matched-1");
  }
  if (
    !next.some(
      (post) => post.status === "open" && post.authorId === CURRENT_USER.id,
    )
  ) {
    ensure("post-mine-open");
  }

  return next;
}

function dedupeMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
}

function ensureDemoMessages(
  posts: MatchingPost[],
  messages: ChatMessage[],
): { messages: ChatMessage[]; newlyUnreadPostIds: string[] } {
  const next = dedupeMessages(messages);
  const newlyUnreadPostIds: string[] = [];
  const seedMessages = createFreshSeedMessages();

  for (const seed of seedMessages) {
    if (!posts.some((post) => post.id === seed.postId)) continue;
    if (!next.some((message) => message.id === seed.id)) {
      next.push(seed);
      newlyUnreadPostIds.push(seed.postId);
    }
  }

  return { messages: next, newlyUnreadPostIds };
}

function loadState(): PersistedState {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem("shinwon-half-half-v2") ??
      window.localStorage.getItem("shinwon-half-half-v1");
    if (!raw) {
      const posts = createFreshSeedPosts();
      const seeded = ensureDemoMessages(posts, []);
      return {
        posts,
        messages: seeded.messages,
        alerts: EMPTY_ALERTS,
        unreadChatPostIds: seeded.newlyUnreadPostIds,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.posts?.length) {
      const posts = createFreshSeedPosts();
      const seeded = ensureDemoMessages(posts, []);
      return {
        posts,
        messages: seeded.messages,
        alerts: parsed.alerts ?? EMPTY_ALERTS,
        unreadChatPostIds: seeded.newlyUnreadPostIds,
      };
    }

    const posts = ensureDemoPosts(parsed.posts.map(normalizePost));
    const seeded = ensureDemoMessages(posts, parsed.messages ?? []);
    const existingUnread = Array.isArray(parsed.unreadChatPostIds)
      ? parsed.unreadChatPostIds
      : [];
    return {
      posts,
      messages: seeded.messages,
      alerts: {
        categories: parsed.alerts?.categories ?? [],
        keywords: parsed.alerts?.keywords ?? [],
      },
      unreadChatPostIds: [
        ...new Set([...existingUnread, ...seeded.newlyUnreadPostIds]),
      ],
    };
  } catch {
    const posts = createFreshSeedPosts();
    const seeded = ensureDemoMessages(posts, []);
    return {
      posts,
      messages: seeded.messages,
      alerts: EMPTY_ALERTS,
      unreadChatPostIds: seeded.newlyUnreadPostIds,
    };
  }
}

export function MatchingStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [posts, setPosts] = useState<MatchingPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [alerts, setAlerts] = useState<AlertPrefs>(EMPTY_ALERTS);
  const [unreadChatPostIds, setUnreadChatPostIds] = useState<string[]>([]);

  useEffect(() => {
    const state = loadState();
    setPosts(state.posts);
    setMessages(state.messages);
    setAlerts(state.alerts);
    setUnreadChatPostIds(state.unreadChatPostIds ?? []);
    setNow(Date.now());
    setReady(true);

    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        posts,
        messages,
        alerts,
        unreadChatPostIds,
      } satisfies PersistedState),
    );
  }, [ready, posts, messages, alerts, unreadChatPostIds]);

  const openPosts = useMemo(() => {
    if (!ready || !now) return [];
    return posts
      .filter((post) => post.status === "open" && remainingMinutes(post, now) > 0)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [posts, ready, now]);

  const myInProgressPosts = useMemo(() => {
    if (!ready) return [];
    return posts
      .filter((post) => post.status === "matched" && isMine(post))
      .sort((a, b) => {
        const aTime = new Date(a.matchedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.matchedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      });
  }, [posts, ready]);

  const myOpenPosts = useMemo(() => {
    if (!ready) return [];
    return posts
      .filter(
        (post) =>
          post.status === "open" &&
          (post.authorId === CURRENT_USER.id ||
            post.participantIds.includes(CURRENT_USER.id)),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [posts, ready]);

  const myActivePosts = useMemo(
    () => [...myInProgressPosts, ...myOpenPosts],
    [myInProgressPosts, myOpenPosts],
  );

  const alertCount = alerts.categories.length + alerts.keywords.length;

  const chatNotifyCount = useMemo(
    () =>
      (unreadChatPostIds ?? []).filter((postId) =>
        posts.some(
          (post) =>
            post.id === postId &&
            post.authorId === CURRENT_USER.id &&
            post.status !== "completed",
        ),
      ).length,
    [unreadChatPostIds, posts],
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
          message.senderId !== CURRENT_USER.id &&
          message.senderId !== "system",
      ),
    [messages],
  );

  const isChatUnread = useCallback(
    (postId: string) => (unreadChatPostIds ?? []).includes(postId),
    [unreadChatPostIds],
  );

  const markChatRead = useCallback((postId: string) => {
    setUnreadChatPostIds((prev) => (prev ?? []).filter((id) => id !== postId));
  }, []);

  const createPost = useCallback((draft: CreateDraft) => {
    if (!draft.category) {
      throw new Error("카테고리를 선택해 주세요.");
    }

    const post: MatchingPost = {
      id: createId("post"),
      category: draft.category,
      itemName: draft.itemName.trim(),
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
      authorId: CURRENT_USER.id,
      authorName: CURRENT_USER.name,
      status: "open",
      imageEmoji: CATEGORY_EMOJI[draft.category],
      participantIds: [CURRENT_USER.id],
    };

    setPosts((prev) => [post, ...prev]);
    return post;
  }, []);

  const updatePost = useCallback((postId: string, draft: CreateDraft) => {
    if (!draft.category) {
      throw new Error("카테고리를 선택해 주세요.");
    }

    let updated: MatchingPost | undefined;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId || post.authorId !== CURRENT_USER.id) return post;
        if (post.status === "completed") return post;

        updated = {
          ...post,
          category: draft.category!,
          itemName: draft.itemName.trim(),
          storeName: draft.storeName.trim(),
          menuName: draft.menuName.trim(),
          totalPrice: draft.totalPrice,
          peopleNeeded: Math.max(draft.peopleNeeded, post.peopleJoined),
          deadlineMinutes: DEADLINE_MINUTES[draft.deadline],
          meetingPlace: draft.meetingPlace,
          customPlace:
            draft.meetingPlace === "custom"
              ? draft.customPlace.trim()
              : undefined,
          note: draft.note.trim() || undefined,
          imageEmoji: CATEGORY_EMOJI[draft.category!],
        };
        return updated;
      }),
    );
    return updated;
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.filter(
        (post) => !(post.id === postId && post.authorId === CURRENT_USER.id),
      ),
    );
    setMessages((prev) => prev.filter((message) => message.postId !== postId));
  }, []);

  const sendMessage = useCallback((postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const post = posts.find((item) => item.id === postId);
    if (!post) return;

    const mine: ChatMessage = {
      id: createId("msg"),
      postId,
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, mine]);

    // Demo auto-reply — keep side effects out of setState updaters
    // so React Strict Mode does not schedule duplicate replies.
    if (post.authorId !== CURRENT_USER.id) {
      const replyId = createId("msg-reply");
      window.setTimeout(() => {
        const reply: ChatMessage = {
          id: replyId,
          postId,
          senderId: post.authorId,
          senderName: post.authorName,
          text: "좋아요! 시간·장소 맞으면 매칭 확정할까요?",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) =>
          prev.some((message) => message.id === replyId)
            ? prev
            : [...prev, reply],
        );
      }, 900);
    }
  }, [posts]);

  const joinSeat = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId || post.status !== "open") return post;
        if (post.peopleJoined >= post.peopleNeeded) return post;
        const participantIds = post.participantIds.includes(CURRENT_USER.id)
          ? post.participantIds
          : [...post.participantIds, CURRENT_USER.id];
        return {
          ...post,
          peopleJoined: post.peopleJoined + 1,
          participantIds,
        };
      }),
    );
  }, []);

  const confirmMatch = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const participantIds = post.participantIds.includes(CURRENT_USER.id)
          ? post.participantIds
          : [...post.participantIds, CURRENT_USER.id];
        return {
          ...post,
          status: "matched",
          peopleJoined: post.peopleNeeded,
          participantIds,
          matchedAt: new Date().toISOString(),
        };
      }),
    );

    const system: ChatMessage = {
      id: createId("msg-matched"),
      postId,
      senderId: "system",
      senderName: "시스템",
      text: "매칭이 확정되었습니다. 약속을 마치면 거래 완료로 바꿔 주세요.",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) =>
      prev.some((message) => message.id === system.id)
        ? prev
        : [...prev, system],
    );
  }, []);

  const completeTrade = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId || !isMine(post)) return post;
        if (post.status !== "matched") return post;
        return { ...post, status: "completed" };
      }),
    );
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
      now,
      posts,
      openPosts,
      myActivePosts,
      myInProgressPosts,
      myOpenPosts,
      alerts,
      alertCount,
      chatNotifyCount,
      getPost,
      getMessages,
      hasIncomingChat,
      isChatUnread,
      markChatRead,
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
      now,
      posts,
      openPosts,
      myActivePosts,
      myInProgressPosts,
      myOpenPosts,
      alerts,
      alertCount,
      chatNotifyCount,
      getPost,
      getMessages,
      hasIncomingChat,
      isChatUnread,
      markChatRead,
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
  const left = remainingMinutes(post, now);
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
