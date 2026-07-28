"use client";

import { useRouter } from "next/navigation";

import { useLogout, useMe } from "@/features/auth";
import { Button } from "@/shared/ui/button/Button";

export default function Home() {
  const router = useRouter();

  const logoutMutation = useLogout();
  const { data: user, isLoading, error } = useMe();

  async function handleLogout() {
    await logoutMutation.mutateAsync();

    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-16 bg-white dark:bg-black">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Welcome to Nidio</h1>

      <section className="w-full max-w-xl rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Current user</h2>

        {isLoading && <p>Loading user...</p>}

        {error && <p className="text-red-500">User not found</p>}

        {user && (
          <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm dark:bg-gray-900 dark:text-white">
            {JSON.stringify(user, null, 2)}
          </pre>
        )}
      </section>

      <Button
        variant="secondary"
        size="md"
        loading={logoutMutation.isPending}
        onClick={handleLogout}
      >
        Logout
      </Button>
    </main>
  );
}
