"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";

type AdminHeaderProps = {
  active?: "dashboard" | "users" | "teams" | "subscriptions" | "notification";
};

export function AdminHeader({ active = "dashboard" }: AdminHeaderProps) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reportCount, setReportCount] = useState<number>(0);

  useEffect(() => {
    async function fetchReportCount() {
      try {
        const reportsRef = collection(db, "reports");
        const q = query(reportsRef, where("status", "==", "open"));
        const snapshot = await getDocs(q);
        setReportCount(snapshot.size);
      } catch (error) {
        console.error("Error fetching report count:", error);
      }
    }
    fetchReportCount();
  }, []);

  const isActive = (key: AdminHeaderProps["active"]) => active === key;

  return (
    <header className="mx-auto w-full flex-none xl:max-w-7xl">
      <div className="container mx-auto px-4 sm:px-0">
        <div className="flex justify-between py-7">
          {/* Left */}
          <div className="flex items-center gap-2 lg:gap-6">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="group inline-flex items-center gap-1.5 text-lg font-bold tracking-wide text-zinc-900 hover:text-zinc-600 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="inline-block size-5 text-purple-600"
              >
                <path d="M4.464 3.162A2 2 0 0 1 6.28 2h7.44a2 2 0 0 1 1.816 1.162l1.154 2.5c.067.145.115.291.145.438A3.508 3.508 0 0 0 16 6H4c-.288 0-.568.035-.835.1.03-.147.078-.293.145-.438l1.154-2.5Z" />
                <path
                  fillRule="evenodd"
                  d="M2 9.5a2 2 0 0 1 2-2h12a2 2 0 1 1 0 4H4a2 2 0 0 1-2-2Zm13.24 0a.75.75 0 0 1 .75-.75H16a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1-.75-.75V9.5Zm-2.25-.75a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 0 0 .75-.75V9.5a.75.75 0 0 0-.75-.75h-.01ZM2 15a2 2 0 0 1 2-2h12a2 2 0 1 1 0 4H4a2 2 0 0 1-2-2Zm13.24 0a.75.75 0 0 1 .75-.75H16a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1-.75-.75V15Zm-2.25-.75a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75h-.01Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>B-Net 管理</span>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-2 lg:flex">
              {/* ホーム */}
              {isActive("dashboard") ? (
                <span className="group flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-950">
                  ホーム
                </span>
              ) : (
                <button
                  onClick={() => router.push("/")}
                  className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-purple-100 hover:text-purple-950 active:bg-purple-200/75 cursor-pointer"
                >
                  ホーム
                </button>
              )}

              {/* ユーザー */}
              {isActive("users") ? (
                <span className="group flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-950">
                  ユーザー
                </span>
              ) : (
                <button
                  onClick={() => router.push("/users")}
                  className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-purple-100 hover:text-purple-950 active:bg-purple-200/75 cursor-pointer"
                >
                  ユーザー
                </button>
              )}

              {/* チーム */}
              {isActive("teams") ? (
                <span className="group flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-950">
                  チーム
                </span>
              ) : (
                <button
                  onClick={() => router.push("/teams")}
                  className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-purple-100 hover:text-purple-950 active:bg-purple-200/75 cursor-pointer"
                >
                  チーム
                </button>
              )}

              {/* サブスクリプション */}
              {isActive("subscriptions") ? (
                <span className="group flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-950">
                  サブスクリプション
                </span>
              ) : (
                <button
                  onClick={() => router.push("/subscriptions")}
                  className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-purple-100 hover:text-purple-950 active:bg-purple-200/75 cursor-pointer"
                >
                  サブスクリプション
                </button>
              )}
            </nav>

            {/* 右上のボタン群（通知・ユーザー・モバイルメニュー） */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 通知 */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:border-zinc-300 hover:text-zinc-950 cursor-pointer"
                >
                  {reportCount > 0 && (
                    <div className="absolute -end-2 -top-2">
                      <span className="rounded-full bg-purple-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                        {reportCount}
                      </span>
                    </div>
                  )}
                  <span className="inline-block size-5">🔔</span>
                </button>
                {notificationsOpen && (
                  <div className="absolute -end-20 z-10 mt-2 w-64 rounded-lg bg-white py-2.5 shadow-xl ring-1 ring-black/5 lg:w-80">
                    <div className="flex items-center justify-between border-b border-zinc-200 px-4 pb-2">
                      <span className="font-semibold text-zinc-900">通知</span>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
                        aria-label="Close notifications"
                      >
                        ✕
                      </button>
                    </div>
                    <button
                      className="flex w-full items-center justify-between text-left text-sm px-4 py-2 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                      onClick={() => router.push("/reports")}
                    >
                      <span>通報一覧へ</span>
                      {reportCount > 0 && (
                        <span className="ml-2 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {reportCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* ユーザーメニュー */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:border-zinc-300 hover:text-zinc-950"
                >
                  <span className="hidden sm:inline">Admin</span>
                  <span className="inline-block size-5 sm:hidden">👤</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute end-0 z-10 mt-2 w-32 rounded-lg bg-white py-2.5 shadow-xl ring-1 ring-black/5">
                    <button className="block w-full px-4 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100">
                      サインアウト（仮）
                    </button>
                  </div>
                )}
              </div>

              {/* モバイルメニュー */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((v) => !v)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:border-zinc-300 hover:text-zinc-950"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* モバイルナビ */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-zinc-200 py-4">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => {
                  router.push("/");
                  setMobileNavOpen(false);
                }}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive("dashboard")
                    ? "bg-purple-100 text-purple-950"
                    : "text-zinc-800 hover:bg-purple-100 hover:text-purple-950"
                }`}
              >
                ホーム
              </button>
              <button
                onClick={() => {
                  router.push("/users");
                  setMobileNavOpen(false);
                }}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive("users")
                    ? "bg-purple-100 text-purple-950"
                    : "text-zinc-800 hover:bg-purple-100 hover:text-purple-950"
                }`}
              >
                ユーザー
              </button>
              <button
                onClick={() => {
                  router.push("/teams");
                  setMobileNavOpen(false);
                }}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive("teams")
                    ? "bg-purple-100 text-purple-950"
                    : "text-zinc-800 hover:bg-purple-100 hover:text-purple-950"
                }`}
              >
                チーム
              </button>
              <button
                onClick={() => {
                  router.push("/subscriptions");
                  setMobileNavOpen(false);
                }}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive("subscriptions")
                    ? "bg-purple-100 text-purple-950"
                    : "text-zinc-800 hover:bg-purple-100 hover:text-purple-950"
                }`}
              >
                サブスクリプション
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}