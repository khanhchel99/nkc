"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "../i18n";
import Carousel from "./Carousel";
import type { Session } from "next-auth";

export function HomeClient({ session }: { session: Session | null }) {
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 bg-gradient-to-b from-white to-gray-100">
      <div className="w-full max-w-7xl mx-auto space-y-12">
        {/* Hero section */}
        <section className="relative w-full h-[60vh] min-h-[400px] rounded-xl overflow-hidden">
          <Carousel />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-50 p-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
              {t("welcomeToNKC")}
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl text-center mb-8">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/services"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium text-lg transition"
              >
                {t("ourServices")}
              </Link>
              <Link
                href="/about"
                className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-full font-medium text-lg transition"
              >
                {t("aboutUs")}
              </Link>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("qualityService")}</h3>
            <p className="text-gray-600">{t("qualityServiceDesc")}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("expertTeam")}</h3>
            <p className="text-gray-600">{t("expertTeamDesc")}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("fastDelivery")}</h3>
            <p className="text-gray-600">{t("fastDeliveryDesc")}</p>
          </div>
        </section>

        {/* CTA section */}
        <section className="bg-blue-600 text-white p-8 md:p-12 rounded-xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t("readyToStart")}</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">{t("ctaDescription")}</p>
          <Link
            href="/contact"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-medium text-lg inline-block"
          >
            {t("contactUs")}
          </Link>
        </section>

        {/* Testimonials section */}
        <section className="py-12">
          <h2 className="text-3xl font-bold mb-8 text-center">{t("testimonials")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <h4 className="font-semibold">{t("clientName1")}</h4>
                  <p className="text-gray-600 text-sm">{t("clientPosition1")}</p>
                </div>
              </div>
              <p className="text-gray-700">"{t("testimonial1")}"</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <h4 className="font-semibold">{t("clientName2")}</h4>
                  <p className="text-gray-600 text-sm">{t("clientPosition2")}</p>
                </div>
              </div>
              <p className="text-gray-700">"{t("testimonial2")}"</p>
            </div>
          </div>
        </section>

        {/* User profile section if logged in */}
        {session?.user && (
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">{t("welcomeBack")}, {session.user.name}!</h2>
            <p className="mb-4">{t("profilePrompt")}</p>
            <Link
              href="/profile"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium inline-block"
            >
              {t("viewProfile")}
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
