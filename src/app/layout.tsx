import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

import { TRPCReactProvider } from "@/trpc/react";
import { auth } from "@/server/auth";
import Header from "./_components/Header";
import CopyrightYear from "./_components/CopyrightYear";

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
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="flex min-h-screen flex-col bg-amber-50 text-stone-800">
        <Header session={session} />
        
        <main className="flex-grow">
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </main>
        
        <footer className="bg-[#232323] text-amber-50 pt-12 pb-4 text-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {/* Address */}
              <div>
                <h3 className="text-lg font-bold mb-4">Address</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="inline-block"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></span>
                    123 Street, New York, USA
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></span>
                    +012 345 67890
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a8 8 0 11-16 0 8 8 0 0116 0z" /></svg></span>
                    mail@domain.com
                  </li>
                </ul>
                <div className="flex gap-2 mt-4">
                  <a href="#" className="w-8 h-8 flex items-center justify-center bg-[#222] rounded text-white hover:bg-[#895D35]" aria-label="Twitter"><svg fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.377 4.6 3.417-2.07 1.623-4.678 2.348-7.29 2.034 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg></a>
                  <a href="#" className="w-8 h-8 flex items-center justify-center bg-[#222] rounded text-white hover:bg-[#895D35]" aria-label="Facebook"><svg fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg></a>
                  <a href="#" className="w-8 h-8 flex items-center justify-center bg-[#222] rounded text-white hover:bg-[#895D35]" aria-label="LinkedIn"><svg fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" /></svg></a>
                </div>
              </div>
              {/* Services */}
              <div>
                <h3 className="text-lg font-bold mb-4">Services</h3>
                <ul className="space-y-2">
                  <li>General Carpentry</li>
                  <li>Furniture Remodeling</li>
                  <li>Wooden Floor</li>
                  <li>Wooden Furniture</li>
                  <li>Custom Carpentry</li>
                </ul>
              </div>
              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-[#895D35]">About Us</a></li>
                  <li><a href="#" className="hover:text-[#895D35]">Contact Us</a></li>
                  <li><a href="#" className="hover:text-[#895D35]">Our Services</a></li>
                  <li><a href="#" className="hover:text-[#895D35]">Terms & Condition</a></li>
                  <li><a href="#" className="hover:text-[#895D35]">Support</a></li>
                </ul>
              </div>
              {/* Newsletter */}
              <div>
                <h3 className="text-lg font-bold mb-4">Newsletter</h3>
                <p className="mb-4 text-xs text-amber-100">Dolor amet sit justo amet elitr clita ipsum elitr est.</p>
                <form className="flex">
                  <input type="email" placeholder="Your email" className="flex-grow px-3 py-2 rounded-l bg-white text-stone-800 focus:outline-none" />
                  <button type="submit" className="bg-[#B4845C] text-white px-4 rounded-r font-semibold hover:bg-[#895D35]">SignUp</button>
                </form>
              </div>
            </div>
            <div className="border-t border-[#333] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs">
              <div className="mb-2 md:mb-0">© <span><CopyrightYear /></span> NKC. All Rights Reserved.</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
