import type { Metadata } from "next";
import { PortfolioShell } from "@/components/PortfolioShell";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.name} — Portfolio`,
  description: site.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PortfolioShell>{children}</PortfolioShell>
      </body>
    </html>
  );
}
