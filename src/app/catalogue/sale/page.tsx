"use client";
import Link from "next/link";
import { useI18n } from "../../i18n";

export default function SalePage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/catalogue" className="text-[#895D35] hover:underline">
                {t("categories")}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-700 font-medium">{t("on_sale")}</li>
          </ol>
        </nav>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-8 mb-8 text-white text-center">
          <div className="text-6xl mb-4">🏷️</div>
          <h1 className="text-4xl font-bold mb-4">{t("on_sale")}</h1>
          <p className="text-xl opacity-90 mb-6">{t("sale_coming_soon")}</p>
          <Link 
            href="/catalogue" 
            className="bg-white text-red-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            {t("browse_all_categories")}
          </Link>
        </div>
      </div>
    </main>
  );
}
