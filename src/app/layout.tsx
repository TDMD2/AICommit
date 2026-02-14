import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Comic Generator — Create Your Comic Book",
  description:
    "Type a story description and watch AI turn it into a stunning comic book with page-flipping experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="vignette" />
      </body>
    </html>
  );
}
