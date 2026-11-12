export type CategoryId =
  | "all"
  | "식당"
  | "간식"
  | "식자재"
  | "생활용품"
  | "의류"
  | "기타";

export type MeetingPlace =
  | "store-front"
  | "main-gate"
  | "back-gate"
  | "custom";

export type DeadlineOption = "30m" | "1h" | "2h" | "today" | "until-deleted";

export type PostStatus = "open" | "matched" | "completed" | "expired";

export interface MatchingPost {
  id: string;
  category: Exclude<CategoryId, "all">;
  itemName: string;
  storeName: string;
  menuName: string;
  totalPrice: number;
  peopleNeeded: number;
  peopleJoined: number;
  deadlineMinutes: number;
  createdAt: string;
  meetingPlace: MeetingPlace;
  customPlace?: string;
  note?: string;
  authorId: string;
  authorName: string;
  status: PostStatus;
  imageEmoji: string;
  participantIds: string[];
  matchedAt?: string;
}

export interface AlertPrefs {
  categories: Exclude<CategoryId, "all">[];
  keywords: string[];
}

export interface PushNotification {
  id: string;
  postId: string;
  title: string;
  body: string;
  reason: string;
  createdAt: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  postId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface CreateDraft {
  category: Exclude<CategoryId, "all"> | null;
  itemName: string;
  storeName: string;
  menuName: string;
  totalPrice: number;
  peopleNeeded: number;
  deadline: DeadlineOption;
  meetingPlace: MeetingPlace;
  customPlace: string;
  note: string;
}

export const CURRENT_USER = {
  id: "user-me",
  name: "나",
} as const;

export const MEETING_PLACE_LABELS: Record<MeetingPlace, string> = {
  "store-front": "가게 앞",
  "main-gate": "시장 정문",
  "back-gate": "시장 후문",
  custom: "직접 입력",
};

export const DEADLINE_LABELS: Record<DeadlineOption, string> = {
  "30m": "30분",
  "1h": "1시간",
  "2h": "2시간",
  today: "오늘 마감",
  "until-deleted": "게시글 삭제 전까지",
};

/** 이 값이면 모집 시간을 세지 않고, 사용자가 삭제할 때까지 목록에 남긴다. */
export const UNTIL_DELETED_MINUTES = 1_000_000_000;

export function isUntilDeleted(minutes: number) {
  return minutes >= UNTIL_DELETED_MINUTES;
}

export const DEADLINE_MINUTES: Record<DeadlineOption, number> = {
  "30m": 30,
  "1h": 60,
  "2h": 120,
  today: 24 * 60,
  "until-deleted": UNTIL_DELETED_MINUTES,
};

/** 예전 '오늘 마감'은 6시간으로 저장돼 있었다. 이제 24시간으로 센다. */
const LEGACY_TODAY_MINUTES = 360;

export function normalizeDeadlineMinutes(minutes: number) {
  return minutes === LEGACY_TODAY_MINUTES ? DEADLINE_MINUTES.today : minutes;
}

/** 선택한 시간이 다 지나기 전에는 그 시간을 분 단위로 올리고, 정각에 0이 된다. */
export function remainingMinutes(
  deadlineMinutes: number,
  createdAt: string | undefined,
  now: number,
) {
  const minutes = normalizeDeadlineMinutes(deadlineMinutes);
  if (isUntilDeleted(minutes)) return minutes;
  if (!createdAt || !now) return minutes;
  const elapsed = (now - new Date(createdAt).getTime()) / 60_000;
  const left = minutes - elapsed;
  if (left <= 0) return 0;
  return Math.min(minutes, Math.ceil(left));
}
