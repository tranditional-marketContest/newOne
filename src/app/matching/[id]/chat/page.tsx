import { Suspense } from "react";
import { ChatRoomClient } from "@/src/components/matching/ChatRoomClient";

export default function MatchingChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<MatchingRouteFallback label="채팅방을 여는 중…" />}>
      <MatchingChat params={params} />
    </Suspense>
  );
}

async function MatchingChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatRoomClient id={id} />;
}

function MatchingRouteFallback({ label }: { label: string }) {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10 text-sm text-[#8a7b6c]">
      {label}
    </main>
  );
}
