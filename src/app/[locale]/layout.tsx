import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { StoreProvider } from "@/lib/redux/provider";
import { NextIntlClientProvider } from 'next-intl';
import { locales } from '@/i18n/index';
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "Bank Account Management",
  description: "Manage your bank accounts easily",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Error loading messages for locale ${locale}:`, error);
    messages = {};
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreProvider>
            <Navbar />
            <main className="min-h-screen pt-6">
              {children}
            </main>
          </StoreProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 