import { PostDetailClient } from "@/src/components/matching/PostDetailClient";

export default async function MatchingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PostDetailClient id={id} />;
}
