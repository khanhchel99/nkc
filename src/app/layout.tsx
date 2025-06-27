import { type Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { getCurrentUser } from "@/lib/server-auth";
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

// Inter for body text - excellent Vietnamese support and readability
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

// Playfair Display for headings - elegant and luxury feel
const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{ 
  children: React.ReactNode;
}>) {
  const session = await getCurrentUser();
  
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="flex min-h-screen flex-col bg-amber-50 text-stone-800 font-inter">
        <I18nProvider defaultLocale="en">
          <LangAttributeUpdater />
          <Header session={session} />
          
          <main className="flex-grow">
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </main>
          
          <FooterClient />
        </I18nProvider>
      </body>
    </html>
  );
}
