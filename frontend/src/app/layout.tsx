import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DashboardProvider } from "@/context/DashboardContext";
import Sidebar from "@/components/Sidebar";
import Chatbot from "@/components/Chatbot";
import HeaderWrapper from "@/components/HeaderWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Catalyst | AI Jira Risk Intelligence",
  description: "AI-Powered Jira defect categorization, quality scoring & sprint risk intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
        <ThemeProvider>
          <DashboardProvider>
            <Sidebar />
            <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64 max-w-full overflow-x-hidden">
              <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full min-w-0 space-y-8">
                <HeaderWrapper />
                {children}
              </div>
            </main>
            <Chatbot />
          </DashboardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
