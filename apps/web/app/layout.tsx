import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { AuthProvider } from "@/app/providers/AuthProvider";
import { ApolloProviderWrapper } from "@/shared/api/provider/apollo-provider";
import { QueryProvider } from "@/shared/api/query/query-provider";
import { RealtimeProvider } from "@/shared/realtime";

import "@/shared/styles/globals.css";

export const viewport: Viewport = {
  themeColor: "#af4b2b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Nidio",
  description: "Nidio — app for couples",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nidio",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="ru" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className="min-h-full flex flex-col font-sans">
        <Toaster />
        <QueryProvider>
          <AuthProvider>
            <ApolloProviderWrapper>
              <RealtimeProvider>{children}</RealtimeProvider>
            </ApolloProviderWrapper>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
