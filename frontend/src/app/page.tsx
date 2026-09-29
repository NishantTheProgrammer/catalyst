"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.is_setup_complete === false) {
            router.push("/settings");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check settings", err);
        router.push("/dashboard");
      }
    };
    
    checkSetup();
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return null;
}
