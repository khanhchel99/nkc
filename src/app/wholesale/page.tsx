"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WholesalePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("wholesale_token");
    if (token) {
      router.push("/wholesale/dashboard");
    } else {
      router.push("/wholesale/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}