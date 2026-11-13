import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  title: "MARIZ — Connected Business Solutions (V2 Preview)",
  description: "MARIZ POS and custom web software for business. V2 preview with a simulated POS demonstration.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}