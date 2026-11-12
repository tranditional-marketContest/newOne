import { getSupabase } from "@/lib/supabase/client";
import { migrateCategory } from "./categories";
import {
  normalizeDeadlineMinutes,
  type ChatMessage,
  type MatchingPost,
  type MeetingPlace,
  type PostStatus,
} from "./types";

const PLACES = new Set<MeetingPlace>(["store-front", "main-gate", "back-gate", "custom"]);
const STATUSES = new Set<PostStatus>(["open", "matched", "completed", "expired"]);

type PostRow = {
  id: string;
  category: string;
  item_name: string;
  store_name: string;
  menu_name: string;
  total_price: number;
  people_needed: number;
  people_joined: number;
  deadline_minutes: number;
  meeting_place: string;
  custom_place: string | null;
  note: string | null;
  author_id: string;
  author_name: string;
  status: string;
  image_emoji: string;
  participant_ids: unknown;
  matched_at: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  post_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
};

function client() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }
  return supabase;
}

function raise(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function asIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

export function rowToPost(row: PostRow): MatchingPost {
  const place = PLACES.has(row.meeting_place as MeetingPlace)
    ? (row.meeting_place as MeetingPlace)
    : "main-gate";
  const status = STATUSES.has(row.status as PostStatus)
    ? (row.status as PostStatus)
    : "open";
  const participantIds = asIds(row.participant_ids);
  return {
    id: row.id,
    category: migrateCategory(row.category, row.id),
    itemName: row.item_name,
    storeName: row.store_name ?? "",
    menuName: row.menu_name ?? "",
    totalPrice: row.total_price,
    peopleNeeded: row.people_needed,
    peopleJoined: row.people_joined,
    deadlineMinutes: normalizeDeadlineMinutes(row.deadline_minutes),
    createdAt: row.created_at,
    meetingPlace: place,
    customPlace: row.custom_place ?? undefined,
    note: row.note ?? undefined,
    authorId: row.author_id,
    authorName: row.author_name,
    status,
    imageEmoji: row.image_emoji || "🛒",
    participantIds: participantIds.length > 0 ? participantIds : [row.author_id],
    matchedAt: row.matched_at ?? undefined,
  };
}

export function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    postId: row.post_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    text: row.body,
    createdAt: row.created_at,
  };
}

function postToRow(post: MatchingPost): PostRow {
  return {
    id: post.id,
    category: post.category,
    item_name: post.itemName,
    store_name: post.storeName,
    menu_name: post.menuName,
    total_price: post.totalPrice,
    people_needed: post.peopleNeeded,
    people_joined: post.peopleJoined,
    deadline_minutes: post.deadlineMinutes,
    meeting_place: post.meetingPlace,
    custom_place: post.customPlace ?? null,
    note: post.note ?? null,
    author_id: post.authorId,
    author_name: post.authorName,
    status: post.status,
    image_emoji: post.imageEmoji,
    participant_ids: post.participantIds,
    matched_at: post.matchedAt ?? null,
    created_at: post.createdAt,
  };
}

export async function fetchMatchingBoard() {
  const supabase = client();
  const [postsResult, messagesResult] = await Promise.all([
    supabase.from("matching_posts").select("*").order("created_at", { ascending: false }),
    supabase.from("matching_messages").select("*").order("created_at", { ascending: true }),
  ]);
  raise(postsResult.error);
  raise(messagesResult.error);
  return {
    posts: ((postsResult.data ?? []) as PostRow[]).map(rowToPost),
    messages: ((messagesResult.data ?? []) as MessageRow[]).map(rowToMessage),
  };
}

export async function insertMatchingPost(post: MatchingPost) {
  const supabase = client();
  const { data, error } = await supabase
    .from("matching_posts")
    .insert(postToRow(post))
    .select("*")
    .single();
  raise(error);
  return rowToPost(data as PostRow);
}

export async function updateMatchingPost(post: MatchingPost) {
  const supabase = client();
  const { data, error } = await supabase
    .from("matching_posts")
    .update(postToRow(post))
    .eq("id", post.id)
    .select("*")
    .single();
  raise(error);
  return rowToPost(data as PostRow);
}

export async function deleteMatchingPost(id: string) {
  const supabase = client();
  const messages = await supabase.from("matching_messages").delete().eq("post_id", id);
  raise(messages.error);
  const removed = await supabase
    .from("matching_posts")
    .delete()
    .eq("id", id)
    .select("id");
  raise(removed.error);
  if (!removed.data?.length) {
    throw new Error("게시글을 삭제하지 못했습니다.");
  }
}

export async function insertMatchingMessage(message: ChatMessage) {
  const supabase = client();
  const { data, error } = await supabase
    .from("matching_messages")
    .insert({
      id: message.id,
      post_id: message.postId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      body: message.text,
      created_at: message.createdAt,
    })
    .select("*")
    .single();
  raise(error);
  return rowToMessage(data as MessageRow);
}
