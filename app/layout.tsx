import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const roobert = localFont({
  src: [
    {
      path: "../public/fonts/roobert.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/roobert_medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/roobert_semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/roobert_bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-roobert",
});

const reckless = localFont({
  src: "../public/fonts/reckless.woff2",
  variable: "--font-reckless",
});

export const metadata: Metadata = {
  title: "Padel Manager - Sistema de Gestión de Torneos",
  description: "Plataforma profesional para gestionar torneos de pádel amateur con ranking automático y seguimiento en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${roobert.variable} ${reckless.variable} font-roobert antialiased min-h-screen dark:bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
