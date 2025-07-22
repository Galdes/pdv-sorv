import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../lib/themeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Talos - Sistema de Comandas",
  description: "Sistema de comandas digitais para bares e restaurantes - Desenvolvido pela Talos Automações e Sistemas Inteligentes",
  icons: {
    icon: [
      {
        url: '/talos-favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#F59E0B',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
