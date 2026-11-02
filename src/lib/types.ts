export type CategoryId =
  | "all"
  | "food"
  | "clothes"
  | "snack"
  | "kitchen"
  | "tools"
  | "etc";

export type MeetingPlace =
  | "store-front"
  | "main-gate"
  | "back-gate"
  | "custom";

export type DeadlineOption = "30m" | "1h" | "2h" | "today";

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
};

export const DEADLINE_MINUTES: Record<DeadlineOption, number> = {
  "30m": 30,
  "1h": 60,
  "2h": 120,
  today: 360,
};
