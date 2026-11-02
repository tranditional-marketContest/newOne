import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { HomeScreen } from "@/components/home-screen";
import { getEventBanner, pendingEventBanner } from "@/lib/event-banner";

export default function Home() {
  return (
    <AppFrame>
      <Suspense fallback={<HomeScreen banner={pendingEventBanner} />}>
        <EventHome />
      </Suspense>
    </AppFrame>
  );
}

async function EventHome() {
  const source = process.env.SEOUL_OPEN_API_KEY ? "ready" : "missing";
  return <HomeScreen banner={await getEventBanner(source)} />;
}
