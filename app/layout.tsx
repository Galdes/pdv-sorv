import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../lib/themeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sorveteria Conteiner - Sistema de Comandas",
  description: "Sistema de comandas digitais para Sorveteria Conteiner - Desenvolvido pela Talos Automações e Sistemas Inteligentes",
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
