import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flux",
  description: "Track your monthly utility consumption and forecast your bill in real-time.",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
