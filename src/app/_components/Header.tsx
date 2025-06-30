"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "../i18n";

export default function Header({ session, darkMode = false }: { session: any, darkMode?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { t } = useI18n();

  // Close menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Top contact bar */}
      <div className={darkMode ? "bg-black text-white py-2 text-sm" : "bg-stone-100 py-2 text-sm"}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center md:items-center">
          <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto">
            <div className="flex items-center mr-6 mb-1 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className={darkMode ? "h-4 w-4 mr-1 text-white" : "h-4 w-4 mr-1 text-[#895D35]"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{t("address_bar_location")}</span>
            </div>
            <div className="flex items-center md:ml-6">
              <svg xmlns="http://www.w3.org/2000/svg" className={darkMode ? "h-4 w-4 mr-1 text-white" : "h-4 w-4 mr-1 text-[#895D35]"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t("address_bar_hours")}</span>
            </div>
            <div className="flex items-center md:ml-6 mt-1 md:mt-0 w-full md:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className={darkMode ? "h-4 w-4 mr-1 text-white" : "h-4 w-4 mr-1 text-[#895D35]"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{t("address_bar_phone")}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-3">
              <a href="#" className={darkMode ? "hover:text-[#FFD700] text-white" : "hover:text-[#895D35]"}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                </svg>
              </a>
              <a href="#" className={darkMode ? "hover:text-[#FFD700] text-white" : "hover:text-[#895D35]"}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className={darkMode ? "hover:text-[#FFD700] text-white" : "hover:text-[#895D35]"}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
              </a>
              <a href="#" className={darkMode ? "hover:text-[#FFD700] text-white" : "hover:text-[#895D35]"}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main header with logo and navigation */}
      <header className={darkMode ? "bg-black shadow-sm sticky top-0 z-50" : "bg-white shadow-sm sticky top-0 z-50"}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className={darkMode ? "text-4xl font-display text-white" : "text-4xl font-display text-luxury"}>
                NKC
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <button 
              className={darkMode ? "md:hidden flex items-center text-white" : "md:hidden flex items-center text-[#895D35]"}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("home")}</Link>
              <Link href="/about" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("about")}</Link>
              <Link href="/services" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("services")}</Link>
              <Link href="/catalogue" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("catalogue")}</Link>
              <Link href="/team" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("manufacturing")}</Link>
              <Link href="/contact" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("contact")}</Link>
              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`flex items-center space-x-2 ${darkMode ? "text-white hover:text-[#FFD700]" : "text-[#895D35] hover:text-[#7A4F2A]"} font-medium`}
                  >
                    <div className="w-8 h-8 bg-[#895D35] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {session.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span>{session.name}</span>
                    <svg 
                      className={`w-4 h-4 transform ${userDropdownOpen ? 'rotate-180' : ''} transition-transform`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth={2} 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{session.name}</p>
                        <p className="text-sm text-gray-500">{session.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{session.role} User</p>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t("profile")}
                      </Link>
                      
                      {session.role === 'wholesale' && (
                        <>
                          <Link 
                            href="/wholesale/dashboard" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Wholesale Dashboard
                          </Link>
                          <Link 
                            href="/inquiry-list" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {t("my_inquiry_list")}
                          </Link>
                        </>
                      )}
                      
                      {session.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <hr className="my-1" />
                      
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t("sign_out")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/signin" className="border border-[#895D35] text-[#895D35] px-5 py-2 rounded font-semibold hover:bg-[#895D35] hover:text-white transition flex items-center gap-2 bg-transparent">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m6-6v12m6-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("sign_in")}
                </Link>
              )}
              <Link href="/quote" className="bg-[#895D35] text-white px-6 py-2 font-medium hover:bg-[#7A4F2A] flex items-center">
                {t("get_a_quote")}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </nav>
          </div>
          
          {/* Mobile navigation */}
          <div className={`md:hidden ${menuOpen ? 'block' : 'hidden'} mt-4 pt-4 border-t`}>
            <nav className="flex flex-col space-y-4">
              <Link href="/" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("home")}</Link>
              <Link href="/about" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("about")}</Link>
              <Link href="/services" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("services")}</Link>
              <Link href="/catalogue" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("catalogue")}</Link>
              <Link href="/team" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("manufacturing")}</Link>
              <Link href="/contact" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("contact")}</Link>
              {session ? (
                <>
                  <Link href="/profile" className={darkMode ? "font-medium hover:text-[#FFD700] text-white" : "font-medium hover:text-[#895D35]"}>{t("profile")}</Link>
                  {session.role === 'wholesale' && (
                    <Link href="/wholesale/dashboard" className="font-medium bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Wholesale Dashboard</Link>
                  )}
                  {session.role === 'admin' && (
                    <Link href="/admin" className="font-medium bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Admin</Link>
                  )}
                </>
              ) : (
                <Link href="/auth/signin" className="border border-[#895D35] text-[#895D35] px-5 py-2 rounded font-semibold hover:bg-[#895D35] hover:text-white transition flex items-center gap-2 bg-transparent">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m6-6v12m6-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("sign_in")}
                </Link>
              )}
              <Link href="/quote" className="bg-[#895D35] text-white px-6 py-2 font-medium hover:bg-[#7A4F2A] flex items-center w-fit">
                {t("get_a_quote")}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}