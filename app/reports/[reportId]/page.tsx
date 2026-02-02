"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient";
import { AdminHeader } from "@/app/components/AdminHeader";

// Firestore の通報ドキュメント型
interface Report {
  id: string;
  contentType: "team_profile" | "user_profile" | string;
  reason: string;
  details?: string;
  status?: "open" | "resolved" | string;
  createdAt?: Timestamp;
  reporterUserId?: string; // 通報したユーザーID
  reportedUserId: string;  // 通報されたユーザーID
  resolvedAt?: Timestamp;
}

// 種別の日本語ラベル
const typeLabelMap: Record<string, string> = {
  team_profile: "チーム", 
  user_profile: "ユーザー",
};

// 通報理由の日本語ラベル
const reasonLabelMap: Record<string, string> = {
  inappropriate: "不適切な内容", 
  spam: "スパム・宣伝",
  other: "その他",
};

function formatDate(ts?: Timestamp) {
  if (!ts) return "-";
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${h}:${min}`;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = (params as { reportId?: string })?.reportId;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const ref = doc(db, "reports", reportId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("通報が見つかりませんでした。");
          setReport(null);
        } else {
          const data = snap.data() as Omit<Report, "id">;
          setReport({ id: snap.id, ...data });
          setError(null);
        }
      } catch (e) {
        console.error("Failed to fetch report", e);
        setError("通報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleResolve = async () => {
    if (!reportId || !report) return;
    try {
      setUpdating(true);
      const ref = doc(db, "reports", reportId);
      await updateDoc(ref, {
        status: "resolved",
        resolvedAt: serverTimestamp(),
      });
      setReport({
        ...report,
        status: "resolved",
      });
    } catch (e) {
      console.error("Failed to update report status", e);
      alert("対応済みに変更できませんでした。");
    } finally {
      setUpdating(false);
    }
  };

  const handleReopen = async () => {
    if (!reportId || !report) return;
    try {
      setUpdating(true);
      const ref = doc(db, "reports", reportId);
      await updateDoc(ref, {
        status: "open",
        resolvedAt: null,
      });
      setReport({
        ...report,
        status: "open",
        resolvedAt: undefined,
      });
    } catch (e) {
      console.error("Failed to reopen report", e);
      alert("未対応に戻せませんでした。");
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => {
    router.push("/reports");
  };

  const statusBadge = (status?: string) => {
    if (status === "resolved") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          対応済み
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
        未対応
      </span>
    );
  };

  const typeLabel = report?.contentType ? typeLabelMap[report.contentType] ?? "その他" : "-";
  const reasonLabel = report?.reason
    ? `${reasonLabelMap[report.reason] ?? "その他"}${
        report.reason === "other" && report.details ? "（自由入力）" : ""
      }`
    : "-";

  return (
    <div className="p-6">
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-zinc-100 px-4 py-6 sm:px-6">
        <AdminHeader active="notification" />
      {/* ヘッダー */}
      <header className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-purple-600">通報詳細</p>
          <h1 className="text-lg font-bold text-zinc-900">通報 ID: {reportId}</h1>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 cursor-pointer"
          aria-label="通報一覧に戻る"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 px-4 py-6 sm:px-6">
        {loading ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            読み込み中です...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : !report ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            通報が見つかりませんでした。
          </div>
        ) : (
          <div className="space-y-6">
            {/* 上部ステータス＋アクション */}
            <div className="flex flex-col justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(report.status)}
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                    {typeLabel}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-900">{reasonLabel}</p>
                <p className="text-xs text-zinc-500">
                  通報日時: {formatDate(report.createdAt)}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {report.status !== "resolved" ? (
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={updating}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {updating ? "更新中..." : "対応済みにする"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReopen}
                    disabled={updating}
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                  >
                    {updating ? "更新中..." : "未対応に戻す"}
                  </button>
                )}
              </div>
            </div>

            {/* 詳細情報 */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-zinc-800">対象情報</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">対象種別</dt>
                    <dd className="font-medium text-zinc-900">{typeLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">通報されたユーザーID</dt>
                    <dd className="font-mono text-xs text-zinc-800 flex items-center gap-2">
                      <span>{report.reportedUserId}</span>
                      <button
                        type="button"
                        className="text-xs underline hover:no-underline cursor-pointer"
                        onClick={() => navigator.clipboard.writeText(report.reportedUserId)}
                      >
                        コピー
                      </button>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-zinc-800">通報者情報</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">通報したユーザーID</dt>
                    <dd className="font-mono text-xs text-zinc-800 flex items-center gap-2">
                      <span>{report.reporterUserId ?? "-"}</span>
                      {report.reporterUserId && (
                        <button
                          type="button"
                          className="text-xs underline hover:no-underline cursor-pointer"
                          onClick={() => navigator.clipboard.writeText(report.reporterUserId!)}
                        >
                          コピー
                        </button>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">対応ステータス</dt>
                    <dd>{statusBadge(report.status)}</dd>
                  </div>
                  {report.resolvedAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">対応日時</dt>
                      <dd className="text-zinc-900">
                        {formatDate(report.resolvedAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>

            {/* 通報内容 */}
            <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-zinc-800">通報内容（詳細）</h2>
              <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-800">
                {report.details && report.details.trim().length > 0
                  ? report.details
                  : "通報内容の詳細は入力されていません。"}
              </div>
            </section>
          </div>
        )}
      {/* ページ下部中央に戻るボタン */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
        >
          通報一覧に戻る
        </button>
      </div>
      </main>
    </div>
    </div>
  );
}