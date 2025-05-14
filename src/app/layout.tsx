import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { auth } from "@/server/auth";
import Header from "./_components/Header";
import { I18nProvider } from "./i18n";
import LangAttributeUpdater from "./_components/LangAttributeUpdater";
import FooterClient from "./_components/FooterClient";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "NKC - Professional Services",
  description: "NKC professional business services",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ 
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="flex min-h-screen flex-col bg-amber-50 text-stone-800">
        <I18nProvider defaultLocale="en">
          <LangAttributeUpdater />
          <Header />
          
          <main className="flex-grow">
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </main>
          
          <FooterClient />
        </I18nProvider>
      </body>
    </html>
  );
}
