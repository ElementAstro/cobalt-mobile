import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";

// Use system fonts to avoid SSL certificate issues with Google Fonts
const systemFonts = {
  sans: {
    variable: "--font-sans",
    className: "font-sans",
  },
  mono: {
    variable: "--font-mono",
    className: "font-mono",
  },
};

export const metadata: Metadata = {
  title: "Cobalt Mobile - Astrophotography Control",
  description: "Advanced mobile astrophotography equipment control and automation platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cobalt Mobile",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cobalt Mobile" />
        <meta name="application-name" content="Cobalt Mobile" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
      </head>
      <body
        className={`${systemFonts.sans.variable} ${systemFonts.mono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
        style={{
          // CSS custom properties for mobile viewport handling
          '--vh': '1vh',
          '--vw': '1vw',
        } as React.CSSProperties}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProvider>

        {/* Mobile viewport height fix script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function setVH() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
              }
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', setVH);
            `,
          }}
        />
      </body>
    </html>
  );
}
