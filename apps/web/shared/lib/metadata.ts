import type { Metadata } from "next";

const siteName = "Nidio";

export function getMetadata({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url?: string;
}): Metadata {
  return {
    title: `${title} | ${siteName}`,
    description,
    alternates: {
      canonical: url,
    },
  };
}
