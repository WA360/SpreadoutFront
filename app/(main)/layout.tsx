import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import Header from "@/components/Header";
import LeftAside from "@/components/LeftAside/LeftAside";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spread Out",
  description: "Spread Out is the best tool for studying with pdf and analyze it",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} flex flex-col`}>
        <Providers>
          <Header />
          <div className="flex flex-1">
            <LeftAside />
            <main className="w-full">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
