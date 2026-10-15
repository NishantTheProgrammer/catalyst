'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.is_setup_complete === false) {
            router.push('/settings');
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to check settings', err);
        router.push('/dashboard');
      }
    };

    checkSetup();
  }, [router]);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Initializing Catalyst...</p>
      </div>
    );
  }

  return null;
}
