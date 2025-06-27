"use client";
// Contact Us page for NKC - matches current theme
import { useI18n } from "../i18n";
import Link from "next/link";
import Image from "next/image";
import ContactInquiryForm from "../_components/ContactInquiryForm";

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <div className="bg-stone-100 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl bg-white rounded-lg shadow-md py-8">
        <h1 className="text-3xl font-bold text-[#895D35] mb-6">{t("contact_us")}</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{t("company_info")}</h2>
          <div className="text-gray-700 space-y-1">
            <div><span className="font-medium">{t("company_name")}:</span> NKC</div>
            <div><span className="font-medium">{t("address")}:</span> Dong van Industrial Zone, Duy Tien District, Hanam province, Vietnam</div>
            <div><span className="font-medium">{t("phone")}:</span> <a href="tel:+84917888689" className="text-[#895D35] hover:underline">+84 917 888 689</a></div>
            <div><span className="font-medium">{t("email")}:</span> <a href="mailto:info@nkc.com" className="text-[#895D35] hover:underline">info@nkc.com</a></div>
            <div><span className="font-medium">{t("working_hours")}:</span> Mon - Fri: 08.00 AM - 06.00 PM GMT+7</div>
          </div>
        </div>
        
        {/* Separator */}
        <div className="border-t border-gray-200 my-8"></div>
        
        {/* Free Quote Section (Image removed) */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-2">{t("free_quote")}</h2>
            <div
              className="h-1 w-16 mb-4"
              style={{ backgroundColor: "#895D35" }}
            ></div>
            <p className="text-gray-600 mb-4">
              {t("free_quote_desc")}
            </p>
            <ContactInquiryForm inquiryType="contact" />
          </div>
        </div>
        
        {/* Separator */}
        <div className="border-t border-gray-200 my-8"></div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{t("find_us")}</h2>          <div className="w-full h-64 rounded overflow-hidden">
            <iframe
              title="NKC Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4428.625580289941!2d105.92241947583426!3d20.65074970065341!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135c8df98025451%3A0xd1d62aa563675a89!2sNguyen%20Khoa%20Hanam%20Co.%2C%20LTD%20(NKC%20Hanam%20CO.%2C%20LTD)!5e1!3m2!1sen!2s!4v1747300648490!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
        
        {/* Separator */}
        <div className="border-t border-gray-200 my-8"></div>
        
        <div className="flex items-center space-x-4 mt-6">
          <a href="#" className="hover:text-[#895D35]" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
          <a href="#" className="hover:text-[#895D35]" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
          <a href="#" className="hover:text-[#895D35]" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
          <a href="#" className="hover:text-[#895D35]" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
        </div>
      </div>
    </div>
  );
}
