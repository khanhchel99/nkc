"use client";

import Link from "next/link";
import Image from "next/image";
import { api } from "@/trpc/react";
import Carousel from "./Carousel";
import { LuUserCheck, LuCheck, LuMessagesSquare, LuHeadphones } from "react-icons/lu";
import { useI18n } from "../i18n";
import type { Session } from "next-auth";

export function HomePageClient({ session }: { session: Session | null }) {
  const { t } = useI18n();
  
  return (
    <>
      {/* Hero Carousel */}
      <Carousel />

      {/* Feature Highlights Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-12 md:gap-24">
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuUserCheck className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">01</div>
              <div className="font-semibold text-lg text-stone-800">{t("creative_designers")}</div>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuCheck className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">02</div>
              <div className="font-semibold text-lg text-stone-800">{t("quality_products")}</div>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuMessagesSquare className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">03</div>
              <div className="font-semibold text-lg text-stone-800">{t("free_consultation")}</div>
            </div>
            {/* Feature 4 */}
            <div className="flex flex-col items-center">
              <div className="bg-[#F5F5F5] p-4 rounded mb-4">
                <LuHeadphones className="w-10 h-10 text-[#B47B3A]" />
              </div>
              <div className="text-5xl font-bold text-[#F5F5F5] mb-2">04</div>
              <div className="font-semibold text-lg text-stone-800">{t("customer_support")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#895D35]">{t("our_services")}</h2>
            <p className="text-lg max-w-2xl mx-auto text-stone-600">{t("services_intro")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: t("business_consulting"), desc: t("business_consulting_desc") },
              { title: t("financial_planning"), desc: t("financial_planning_desc") },
              { title: t("digital_transformation"), desc: t("digital_transformation_desc") }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-amber-100 h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-semibold text-[#895D35]">{t("service_image")} {index + 1}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#895D35]">{service.title}</h3>
                  <p className="text-stone-600 mb-4">{service.desc}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[#895D35]">{t("starting_at")} $499</span>
                    <Link href={`/services/${index + 1}`} className="bg-[#895D35] text-amber-50 px-4 py-2 rounded hover:bg-[#7A4F2A]">
                      {t("learn_more")}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/services" className="bg-[#895D35] text-amber-50 px-6 py-3 rounded-md font-semibold hover:bg-[#7A4F2A] inline-block">
              {t("view_all_services")}
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-amber-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-[#895D35]">{t("about_nkc")}</h2>
              <p className="text-lg mb-6 text-stone-700">
                {t("about_nkc_1")}
              </p>
              <p className="text-lg mb-8 text-stone-700">
                {t("about_nkc_2")}
              </p>
              <Link href="/about" className="bg-[#895D35] text-amber-50 px-6 py-3 rounded-md font-semibold hover:bg-[#7A4F2A] inline-block">
                {t("learn_more")}
              </Link>
            </div>
            <div className="bg-amber-200 h-96 rounded-lg relative">              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-semibold text-[#895D35]">{t("manufacturing")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Profile Section (visible only when logged in) */}
      {session?.user && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto">
              <div className="bg-amber-50 rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold mb-6 text-[#895D35]">{t("your_profile")}</h2>
                <UserProfile />
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

// UserProfile component that displays user information
function UserProfile() {
  const { t } = useI18n();
  const { data: user, isLoading } = api.user.getCurrentUser.useQuery();

  if (isLoading) {
    return <div className="text-center text-[#895D35]">{t("loading_profile")}</div>;
  }

  if (!user) {
    return <div className="text-center text-[#895D35]">{t("user_not_found")}</div>;
  }

  return (
    <div>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[#895D35]/70">{t("name")}</p>
          <p className="text-xl">{user.name ?? t("not_set")}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">{t("email")}</p>
          <p className="text-xl">{user.email ?? t("not_set")}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">{t("title")}</p>
          <p className="text-xl">{user.title ?? t("not_set")}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">{t("company")}</p>
          <p className="text-xl">{user.company ?? t("not_set")}</p>
        </div>
        <div>
          <p className="text-sm text-[#895D35]/70">{t("phone")}</p>
          <p className="text-xl">{user.phone ?? t("not_set")}</p>
        </div>
      </div>
      <div className="mt-6">
        <Link href="/profile/edit" className="bg-[#895D35] text-amber-50 px-4 py-2 rounded hover:bg-[#7A4F2A] inline-block">
          {t("edit_profile")}
        </Link>
      </div>
    </div>
  );
}
