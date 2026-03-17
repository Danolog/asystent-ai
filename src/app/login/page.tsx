"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (error) {
          setError(error.message || "Rejestracja nie powiodła się");
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          setError(error.message || "Logowanie nie powiodło się");
          return;
        }
      }
      router.push("/chat");
      router.refresh();
    } catch {
      setError("Wystąpił nieoczekiwany błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🌙 Luna AI
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isRegister ? "Utwórz konto" : "Zaloguj się"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Imię
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Twoje imię"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.pl"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hasło
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 znaków"
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading
              ? "Ładowanie..."
              : isRegister
                ? "Zarejestruj się"
                : "Zaloguj się"}
          </button>
        </form>

        {!isRegister && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-500 dark:bg-gray-900">lub</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setError(null);
                setLoading(true);
                try {
                  const res = await authClient.signIn.passkey();
                  if (res?.error) {
                    setError(res.error.message || "Logowanie biometryczne nie powiodło się");
                  } else {
                    router.push("/chat");
                    router.refresh();
                  }
                } catch {
                  setError("Urządzenie nie obsługuje logowania biometrycznego");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Zaloguj się biometrycznie
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          {isRegister ? "Masz już konto?" : "Nie masz konta?"}{" "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isRegister ? "Zaloguj się" : "Zarejestruj się"}
          </button>
        </p>
      </div>
    </div>
  );
}
