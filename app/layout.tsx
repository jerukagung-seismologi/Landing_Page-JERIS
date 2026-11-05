import type { Metadata } from "next"
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://jerukagunglabs.web.id"),
  title: {
    template: "%s | Jerukagung Seismologi",
    default: "Laboratorium | Jerukagung Seismologi",
  },
  description: "Penelitian dan Pengembangan Pemantauan Sains Atmosfer Jerukagung Seismologi",
  keywords: [
    "Jerukagung",
    "Seismologi",
    "Pemantauan",
    "Sains Atmosfer",
    "Penelitian",
    "Pengembangan",
    "Teknologi",
    "Sensor",
    "Aktuator",
  ],
  verification: {
    google: "Sfw4AJux-0gq0e5K8YlW5k8F9dK_WbmGEjKsWD-3hXM",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/img/logo.png",
        href: "/img/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/img/logo.png",
        href: "/img/logo.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
