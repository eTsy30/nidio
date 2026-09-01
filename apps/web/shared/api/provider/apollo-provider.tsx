"use client";

import { ApolloProvider } from "@apollo/client/react";

import { apolloClient } from "@/shared/lib/apollo-client";

export function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
