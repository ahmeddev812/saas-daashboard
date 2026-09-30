import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { THEME_INIT_SCRIPT } from "@/app/theme-init";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ATLARIS — SaaS Analytics Dashboard",
    template: "%s · ATLARIS",
  },
  description:
    "ATLARIS carries the operational weight of your business while making its important data visible. Carry your business. See everything.",
  keywords: ["ATLARIS", "analytics", "SaaS", "dashboard", "MRR", "revenue"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Pre-paint theme bootstrap — kept out of React's element tree on
            purpose; see theme-init.ts. */}
        <div style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
