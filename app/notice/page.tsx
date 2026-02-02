"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { AdminHeader } from "@/app/components/AdminHeader";

// Firestore に保存するお知らせの型
export type Announcement = {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  prefectures: string[]; // とりあえず string 配列にしておく（後で型を絞る）
  timestamp: Timestamp | null;
};

export default function NoticePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // フォーム用 state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [prefectureInput, setPrefectureInput] = useState(""); // カンマ区切り入力

  // 一覧の取得
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "announcements"),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const list: Announcement[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: (data.title as string) ?? "(タイトルなし)",
          content: (data.content as string) ?? "",
          isImportant: (data.isImportant as boolean) ?? false,
          prefectures: (data.prefectures as string[]) ?? [],
          timestamp: (data.timestamp as Timestamp) ?? null,
        };
      });
      setAnnouncements(list);
    } catch (error) {
      console.error("Failed to fetch announcements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // お知らせ作成
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setCreating(true);
    try {
      const prefectures = prefectureInput
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        content: content.trim(),
        isImportant,
        prefectures,
        timestamp: serverTimestamp(),
      });

      // 送信後はフォームをリセット
      setTitle("");
      setContent("");
      setIsImportant(false);
      setPrefectureInput("");

      // 一覧を再取得
      await fetchAnnouncements();
    } catch (error) {
      console.error("Failed to create announcement", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このお知らせを削除しますか？")) return;

    try {
      await deleteDoc(doc(db, "announcements", id));
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete announcement", error);
      alert("削除に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminHeader active="notice"/>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
        <h1 className="text-xl font-semibold text-zinc-900">お知らせ一覧・作成</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Baseball Net アプリに表示するお知らせをここから作成できます。
        </p>

        {/* お知らせ作成フォーム */}
        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-base font-semibold text-zinc-800">新規お知らせ作成</h2>
          <p className="mt-1 text-xs text-zinc-500">
            タイトルと本文は必須です。プレミアム関連など重要なお知らせは「重要」にチェックしてください。
          </p>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-zinc-700">
                タイトル
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：ランキング更新タイミングについて"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700">
                本文
              </label>
              <textarea
                className="mt-1 h-40 w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="お知らせの内容を入力してください"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  対象都道府県（カンマ区切り／空欄なら全ユーザー）
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={prefectureInput}
                  onChange={(e) => setPrefectureInput(e.target.value)}
                  placeholder="例：沖縄, 東京"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  id="isImportant"
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                />
                <label
                  htmlFor="isImportant"
                  className="text-xs font-medium text-zinc-700"
                >
                  重要なお知らせとしてマークする
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 cursor-pointer"
              >
                {creating ? "送信中..." : "お知らせを作成"}
              </button>
            </div>
          </form>
        </section>

        {/* 一覧 */}
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-800">お知らせ一覧</h2>
            {loading && (
              <span className="text-xs text-zinc-400">読み込み中...</span>
            )}
          </div>

          {announcements.length === 0 ? (
            <p className="text-sm text-zinc-500">
              まだお知らせは登録されていません。
            </p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-900">
                          {a.title}
                        </h3>
                        {a.isImportant && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            重要
                          </span>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-700">
                        {a.content}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                        {a.timestamp && (
                          <span>
                            {a.timestamp.toDate().toLocaleString("ja-JP", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {a.prefectures.length > 0 && (
                          <span>
                            対象: {a.prefectures.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}