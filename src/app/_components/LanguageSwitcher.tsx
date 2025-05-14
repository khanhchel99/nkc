"use client";
import Image from "next/image";
import { useI18n } from "../i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex gap-3 items-center">
      <button
        onClick={() => setLocale("en")}
        className={`flex items-center gap-1.5 ${locale === "en" ? "font-bold" : "opacity-70 hover:opacity-100"}`}
      >
        <span>EN</span>
        <span className="inline-block w-5 h-3.5 relative overflow-hidden border border-gray-200 rounded-sm shadow-sm">
          <Image
            src="/images/flags/gb.svg" 
            alt="English"
            fill
            style={{ objectFit: "cover" }}
          />
        </span>
      </button>
      <span>|</span>
      <button
        onClick={() => setLocale("vi")}
        className={`flex items-center gap-1.5 ${locale === "vi" ? "font-bold" : "opacity-70 hover:opacity-100"}`}
      >
        <span>VI</span>
        <span className="inline-block w-5 h-3.5 relative overflow-hidden border border-gray-200 rounded-sm shadow-sm">
          <Image
            src="/images/flags/vn.svg" 
            alt="Vietnamese"
            fill
            style={{ objectFit: "cover" }}
          />
        </span>
      </button>
    </div>
  );
}
