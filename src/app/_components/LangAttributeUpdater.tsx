"use client";

import { useI18n } from "../i18n";
import { useEffect } from "react";

export default function LangAttributeUpdater() {
  const { locale } = useI18n();
  
  useEffect(() => {
    // Update the HTML lang attribute whenever the locale changes
    document.documentElement.lang = locale;
  }, [locale]);
  
  // This component doesn't render anything visible
  return null;
}
