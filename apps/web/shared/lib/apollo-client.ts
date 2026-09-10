import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from "@apollo/client";

import { refreshAccessToken } from "@/shared/api/session/session-coordinator";
import { getAccessToken } from "@/shared/lib/token";

function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    statusCode?: unknown;
    response?: { status?: unknown };
    message?: unknown;
  };
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  return (
    candidate.statusCode === 401 ||
    candidate.response?.status === 401 ||
    message.includes("unauthorized") ||
    message.includes("invalid token")
  );
}

function hasUnauthorizedGraphQLError(result: { errors?: readonly unknown[] }): boolean {
  return (
    result.errors?.some((error) => {
      if (!error || typeof error !== "object") {
        return false;
      }

      const candidate = error as {
        extensions?: { code?: unknown };
        message?: unknown;
      };
      return candidate.extensions?.code === "UNAUTHENTICATED" || isUnauthorized(candidate);
    }) ?? false
  );
}

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
  credentials: "include",
});

const authLink = new ApolloLink((operation, forward) => {
  const token = getAccessToken();
  operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  }));
  return forward(operation);
});

const sessionRetryLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let subscription: { unsubscribe: () => void } | undefined;
    let retried = false;
    let closed = false;

    const retry = async (): Promise<void> => {
      try {
        const token = await refreshAccessToken();
        if (closed) return;

        operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
          headers: {
            ...headers,
            authorization: `Bearer ${token}`,
          },
        }));
        execute();
      } catch (error) {
        if (!closed) observer.error(error);
      }
    };

    const execute = (): void => {
      subscription = forward(operation).subscribe({
        next: (result) => {
          if (!retried && hasUnauthorizedGraphQLError(result)) {
            retried = true;
            void retry();
            return;
          }
          observer.next(result);
        },
        error: (error) => {
          if (!retried && isUnauthorized(error)) {
            retried = true;
            void retry();
            return;
          }
          observer.error(error);
        },
        complete: () => observer.complete(),
      });
    };

    execute();
    return () => {
      closed = true;
      subscription?.unsubscribe();
    };
  });
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([sessionRetryLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    },
    query: {
      fetchPolicy: "cache-first",
    },
  },
});
