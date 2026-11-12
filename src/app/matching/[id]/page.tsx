import { Suspense } from "react";
import { PostDetailClient } from "@/src/components/matching/PostDetailClient";

export default function MatchingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<MatchingRouteFallback label="반띵 글을 여는 중…" />}>
      <MatchingDetail params={params} />
    </Suspense>
  );
}

async function MatchingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetailClient id={id} />;
}

function MatchingRouteFallback({ label }: { label: string }) {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10 text-sm text-[#8a7b6c]">
      {label}
    </main>
  );
}
