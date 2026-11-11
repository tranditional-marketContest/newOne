"use client";

import Link from "next/link";
import {
  formatPrice,
  getRemainingLabel,
  placeLabel,
  pricePerPerson,
  useMatchingStore,
} from "@/lib/matching/store";
import type { MatchingPost } from "@/lib/matching/types";

interface PostCardProps {
  post: MatchingPost;
  showRemaining?: boolean;
  matchedLabel?: string;
}

export function PostCard({
  post,
  showRemaining = true,
  matchedLabel,
}: PostCardProps) {
  const { now } = useMatchingStore();
  const perPerson = pricePerPerson(post.totalPrice, post.peopleNeeded);
  const seatsLeft = Math.max(post.peopleNeeded - post.peopleJoined, 0);
  const remaining = getRemainingLabel(post, now);

  return (
    <Link
      href={`/matching/${post.id}`}
      className="fade-up relative block overflow-hidden rounded-[1.4rem] border border-hanji-soft bg-hanji-main/90 px-3 py-3 transition hover:-translate-y-0.5"
    >
      <div className="flex gap-3">
        <div className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-[1.1rem] bg-gradient-to-br from-hanji-soft to-hanok-light/50">
          <span className="text-4xl">{post.imageEmoji}</span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-[family-name:var(--font-display)] text-[1.05rem] font-bold text-ink">
            {post.itemName} {post.peopleNeeded}명이서 나눠요
          </h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-1">
            <span className="text-lg font-bold text-hanok-deep">
              {formatPrice(perPerson)}
            </span>
            <span className="text-sm text-hanok-bright">
              / 1인 · 총 {formatPrice(post.totalPrice)}
            </span>
          </p>
          <p className="mt-1 truncate text-xs text-hanok-main">
            📍{" "}
            {[post.storeName.trim(), placeLabel(post.meetingPlace, post.customPlace)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: post.peopleNeeded }).map((_, index) => (
                  <span
                    key={`${post.id}-seat-${index}`}
                    className={`h-2.5 w-2.5 rounded-full border ${
                      index < post.peopleJoined
                        ? "border-hanok-darkest bg-hanok-darkest"
                        : "border-hanji-fiber bg-hanji-main"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-hanok-deep">
                {matchedLabel ?? `${seatsLeft}자리 남음`}
              </span>
            </div>
            {showRemaining ? (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  remaining === "마감" ? "text-hanok-bright" : "text-danger"
                }`}
              >
                ⏱ {remaining}
              </span>
            ) : (
              <span className="text-xs font-medium text-hanok-deep">성사</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
