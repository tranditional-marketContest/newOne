import { ChatRoomClient } from "@/src/components/matching/ChatRoomClient";

export default async function MatchingChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatRoomClient id={id} />;
}
