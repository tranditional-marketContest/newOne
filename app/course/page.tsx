import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { CourseApp } from "./course-app";

export const metadata: Metadata = {
  title: "코스 추천 · 신원시장",
};

export default function CoursePage() {
  return (
    <AppFrame>
      <CourseApp />
    </AppFrame>
  );
}
