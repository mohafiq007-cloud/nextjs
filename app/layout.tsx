import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MARIZ — Connected Business Solutions (V2 Preview)",
  description: "Explore MARIZ CO, MARIZ POS and MARIZ Events. V2 private preview with simulated product demos.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}