import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

if (process.env.VERCEL === "1" && process.env.NODE_ENV === "production") {
  for (const name of [
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_GRAPHQL_URL",
    "NEXT_PUBLIC_REALTIME_URL",
  ]) {
    const value = process.env[name];
    let url: URL;
    try {
      url = new URL(value ?? "");
    } catch {
      throw new Error(`Set ${name} to the public HTTPS API URL in Vercel Environment Variables.`);
    }
    if (
      url.protocol !== "https:" ||
      url.hostname === "localhost" ||
      url.hostname.endsWith(".localhost") ||
      url.hostname === "[::1]" ||
      url.hostname.startsWith("127.")
    ) {
      throw new Error(
        `${name} must point to the public HTTPS API, not localhost. Update Vercel Environment Variables and redeploy.`,
      );
    }
  }
}

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
})(nextConfig);
