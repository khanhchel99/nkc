"use client";

import React from "react";

export default function CopyrightYear() {
  // Avoid SSR/client mismatch by rendering only on client
  const [year, setYear] = React.useState<number | null>(null);
  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return <>{year ?? ""}</>;
}
