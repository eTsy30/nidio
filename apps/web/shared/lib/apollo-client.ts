import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from "@apollo/client";

import { getAccessToken, removeAccessToken, setAccessToken } from "@/shared/lib/token";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const pendingRequests: Array<(token: string | null) => void> = [];

function subscribeToRefresh(callback: (token: string | null) => void) {
  pendingRequests.push(callback);
}

function notifyRefreshSubscribers(token: string | null) {
  pendingRequests.forEach((cb) => cb(token));
  pendingRequests.length = 0;
}

async function doRefresh(): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      throw new Error("Refresh failed");
    }

    const data = await response.json();

    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }

    return null;
  } catch {
    removeAccessToken();
    return null;
  }
}

async function refreshToken(): Promise<string | null> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = doRefresh().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  return refreshPromise!;
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

const errorLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const subscription = forward(operation).subscribe({
      next: (result) => {
        if (result.errors) {
          const unauthorized = result.errors.some(
            (err) =>
              err.extensions?.code === "UNAUTHENTICATED" ||
              (typeof err.message === "string" &&
                (err.message.toLowerCase().includes("unauthorized") ||
                  err.message.toLowerCase().includes("invalid token"))),
          );

          if (unauthorized) {
            subscribeToRefresh((token) => {
              if (!token) {
                if (typeof window !== "undefined") {
                  window.location.href = "/login";
                }
                observer.error(new Error("Session expired"));
                return;
              }

              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${token}`,
                },
              });

              forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
            });

            if (!isRefreshing) {
              refreshToken().then((token) => {
                notifyRefreshSubscribers(token);
              });
            }
            return;
          }
        }
        observer.next(result);
      },
      error: (error) => {
        if (
          error.statusCode === 401 ||
          error.response?.status === 401 ||
          error.message?.toLowerCase().includes("unauthorized")
        ) {
          subscribeToRefresh((token) => {
            if (!token) {
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              observer.error(new Error("Session expired"));
              return;
            }

            const oldHeaders = operation.getContext().headers;
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `Bearer ${token}`,
              },
            });

            forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
          });

          if (!isRefreshing) {
            refreshToken().then((token) => {
              notifyRefreshSubscribers(token);
            });
          }
          return;
        }
        observer.error(error);
      },
      complete: () => observer.complete(),
    });

    return () => subscription.unsubscribe();
  });
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
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
