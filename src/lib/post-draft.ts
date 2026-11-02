import {
  DEADLINE_MINUTES,
  type CreateDraft,
  type DeadlineOption,
  type MatchingPost,
} from "./types";

export function deadlineFromMinutes(minutes: number): DeadlineOption {
  const entries = Object.entries(DEADLINE_MINUTES) as [
    DeadlineOption,
    number,
  ][];
  const exact = entries.find(([, value]) => value === minutes);
  if (exact) return exact[0];
  if (minutes <= 30) return "30m";
  if (minutes <= 60) return "1h";
  if (minutes <= 120) return "2h";
  return "today";
}

export function draftFromPost(post: MatchingPost): CreateDraft {
  return {
    category: post.category,
    itemName: post.itemName,
    storeName: post.storeName,
    menuName: post.menuName,
    totalPrice: post.totalPrice,
    peopleNeeded: post.peopleNeeded,
    deadline: deadlineFromMinutes(post.deadlineMinutes),
    meetingPlace: post.meetingPlace,
    customPlace: post.customPlace ?? "",
    note: post.note ?? "",
  };
}
