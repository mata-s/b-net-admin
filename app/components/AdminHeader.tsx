"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { getAuth, signOut } from "firebase/auth";

type AdminHeaderProps = {
  active?: "dashboard" | "users" | "teams" | "subscriptions" | "notification" | "notice" | "event";
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

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
              <img
                src="/icon.png"
                alt="B-Net Admin Icon"
                className="inline-block size-5"
              />
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

            {/* お知らせ */}
              {isActive("notice") ? (
                <span className="group flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-950">
                  お知らせ
                </span>
              ) : (
                <button
                  onClick={() => router.push("/notice")}
                  className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-purple-100 hover:text-purple-950 active:bg-purple-200/75 cursor-pointer"
                >
                  お知らせ
                </button>
              )}
              
              {/* イベント */}
              {isActive("event") ? (
                <span className="group flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-950">
                  イベント
                </span>
              ) : (
                <button
                  onClick={() => router.push("/event")}
                  className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-purple-100 hover:text-purple-950 active:bg-purple-200/75 cursor-pointer"
                >
                  イベント
                </button>
              )}
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-red-100 hover:text-red-700 active:bg-red-200/75 cursor-pointer"
              >
                ログアウト
              </button>
            </nav>

            {/* 右上のボタン群（通知・ユーザー・モバイルメニュー） */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 通知 */}
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer ${
                    isActive("notification")
                      ? "bg-purple-100 text-purple-950 border border-purple-200"
                      : "border border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:text-zinc-950"
                  }`}
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
              <button
                onClick={() => {
                  router.push("/notice");
                  setMobileNavOpen(false);
                }}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive("notice")
                    ? "bg-purple-100 text-purple-950"
                    : "text-zinc-800 hover:bg-purple-100 hover:text-purple-950"
                }`}
              >
                お知らせ
              </button>
              <button
                onClick={() => {
                  router.push("/event");
                  setMobileNavOpen(false);
                }}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive("event")
                    ? "bg-purple-100 text-purple-950"
                    : "text-zinc-800 hover:bg-purple-100 hover:text-purple-950"
                }`}
              >
                イベント
              </button>
              <button
                onClick={async () => {
                  await handleLogout();
                  setMobileNavOpen(false);
                }}
                className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                ログアウト
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}