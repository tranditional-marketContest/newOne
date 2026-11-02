import type { ChatMessage, MatchingPost } from "./types";
import { CURRENT_USER } from "./types";

/** Seed templates. createdAt is filled on first client load. */
export const SEED_POSTS: MatchingPost[] = [
  {
    id: "post-1",
    category: "food",
    itemName: "감귤 5kg 박스",
    storeName: "청과 한마당",
    menuName: "제주감귤 5kg",
    totalPrice: 18000,
    peopleNeeded: 3,
    peopleJoined: 1,
    deadlineMinutes: 60,
    createdAt: "",
    meetingPlace: "main-gate",
    note: "정문 앞에서 바로 나눠 가져가요",
    authorId: "user-a",
    authorName: "별빛산책",
    status: "open",
    imageEmoji: "🍊",
    participantIds: ["user-a"],
  },
  {
    id: "post-2",
    category: "food",
    itemName: "순대국밥 세트",
    storeName: "소문난순대집",
    menuName: "모둠순대 + 국밥",
    totalPrice: 16000,
    peopleNeeded: 2,
    peopleJoined: 1,
    deadlineMinutes: 90,
    createdAt: "",
    meetingPlace: "store-front",
    authorId: "user-b",
    authorName: "신림러",
    status: "open",
    imageEmoji: "🥘",
    participantIds: ["user-b"],
  },
  {
    id: "post-3",
    category: "clothes",
    itemName: "양말 10켤레 묶음",
    storeName: "시장양말집",
    menuName: "면양말 10켤레",
    totalPrice: 12000,
    peopleNeeded: 4,
    peopleJoined: 2,
    deadlineMinutes: 120,
    createdAt: "",
    meetingPlace: "back-gate",
    note: "색상은 나중에 고를 수 있어요",
    authorId: "user-c",
    authorName: "도림천행",
    status: "open",
    imageEmoji: "🧦",
    participantIds: ["user-c", "user-f"],
  },
  {
    id: "post-4",
    category: "snack",
    itemName: "호떡 한 판",
    storeName: "신원 호떡",
    menuName: "씨앗호떡 12개",
    totalPrice: 10000,
    peopleNeeded: 2,
    peopleJoined: 1,
    deadlineMinutes: 45,
    createdAt: "",
    meetingPlace: "store-front",
    authorId: "user-d",
    authorName: "호떡좋아",
    status: "open",
    imageEmoji: "🥞",
    participantIds: ["user-d"],
  },
  {
    id: "post-5",
    category: "kitchen",
    itemName: "김치 2kg",
    storeName: "엄마손반찬",
    menuName: "배추김치 2kg",
    totalPrice: 14000,
    peopleNeeded: 2,
    peopleJoined: 1,
    deadlineMinutes: 180,
    createdAt: "",
    meetingPlace: "main-gate",
    note: "당일 담근 김치예요",
    authorId: "user-e",
    authorName: "반찬메이트",
    status: "open",
    imageEmoji: "🥬",
    participantIds: ["user-e"],
  },
  {
    id: "post-matched-1",
    category: "food",
    itemName: "사과 10입",
    storeName: "과일나라",
    menuName: "부사 사과 10입",
    totalPrice: 12000,
    peopleNeeded: 3,
    peopleJoined: 3,
    deadlineMinutes: 120,
    createdAt: "",
    meetingPlace: "main-gate",
    note: "정문에서 바로 나눴어요",
    authorId: "user-a",
    authorName: "별빛산책",
    status: "matched",
    imageEmoji: "🍎",
    participantIds: ["user-a", CURRENT_USER.id, "user-g"],
    matchedAt: "",
  },
  {
    id: "post-mine-open",
    category: "snack",
    itemName: "씨앗호떡 한 판",
    storeName: "신원 호떡",
    menuName: "씨앗호떡 12개",
    totalPrice: 10000,
    peopleNeeded: 2,
    peopleJoined: 1,
    deadlineMinutes: 90,
    createdAt: "",
    meetingPlace: "store-front",
    note: "식기 전에 나눠 가요",
    authorId: CURRENT_USER.id,
    authorName: CURRENT_USER.name,
    status: "open",
    imageEmoji: "🥞",
    participantIds: [CURRENT_USER.id],
  },
];

const SEED_OFFSETS_MINUTES = [21, 35, 10, 5, 40, 180, 12];

export function createFreshSeedPosts(now = Date.now()): MatchingPost[] {
  return SEED_POSTS.map((post, index) => {
    const createdAt = new Date(
      now - (SEED_OFFSETS_MINUTES[index] ?? 15) * 60_000,
    ).toISOString();
    return {
      ...post,
      createdAt,
      matchedAt:
        post.status === "matched"
          ? new Date(now - 90 * 60_000).toISOString()
          : undefined,
    };
  });
}

/** Demo: someone else contacted my open post. */
export function createFreshSeedMessages(now = Date.now()): ChatMessage[] {
  return [
    {
      id: "seed-msg-neighbor-1",
      postId: "post-mine-open",
      senderId: "user-neighbor",
      senderName: "시장골목",
      text: "안녕하세요! 씨앗호떡 반띵 가능할까요?",
      createdAt: new Date(now - 8 * 60_000).toISOString(),
    },
  ];
}
