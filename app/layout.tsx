import type { Metadata } from "next";

import "./globals.css";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

const themeScript = `
(function() {
  try {
    var savedTheme = localStorage.getItem("cinevault-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = savedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (error) {}
})();
`;

export const metadata: Metadata = {
  title: {
    default: "CineVault",
    template: "%s | CineVault"
  },
  description: "A movie research and community platform for global cinema."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Navbar />
        <main className="min-h-[calc(100vh-156px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
