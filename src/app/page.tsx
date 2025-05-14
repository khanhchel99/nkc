// This is a Server Component
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Carousel from "./_components/Carousel";
import { LuUserCheck, LuCheck, LuMessagesSquare, LuHeadphones } from "react-icons/lu";
import { HomePageClient } from "@/app/_components/HomePageClient";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.user.getCurrentUser.prefetch();
  }

  return (
    <HydrateClient>
      <HomePageClient session={session} />
    </HydrateClient>
  );
}
