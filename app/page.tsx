import { Suspense } from "react";
import { AppFrame } from "@/components/app-frame";
import { HomeScreen } from "@/components/home-screen";
import { getEventBanner, pendingEventBanner } from "@/lib/event-banner";
import { getStores } from "@/lib/stores";

export default function Home() {
  return (
    <AppFrame>
      <Suspense fallback={<HomeScreen banner={pendingEventBanner} stores={[]} />}>
        <EventHome />
      </Suspense>
    </AppFrame>
  );
}

async function EventHome() {
  const source = process.env.SEOUL_OPEN_API_KEY ? "ready" : "missing";
  const [banner, stores] = await Promise.all([getEventBanner(source), getStores()]);
  return <HomeScreen banner={banner} stores={stores} />;
}
