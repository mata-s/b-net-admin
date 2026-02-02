"use client";

import { useState } from "react";
import { AdminHeader } from "@/app/components/AdminHeader";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebaseClient"; // ensure Firebase app is initialized


export default function EventPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunCampaign = async () => {
    if (!confirm("全ユーザーを走査して不足しているサブスクを付与します。実行しますか？")) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const usersSnap = await getDocs(collection(db, "users"));

      let checked = 0;
      let created = 0;

      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        checked++;

        const subRef = doc(
          db,
          "users",
          userId,
          "subscription",
          "iOS"
        );

        const subSnap = await getDoc(subRef);

        if (!subSnap.exists()) {
          await setDoc(subRef, {
            status: "active",
            campaign: "キャンペーン中",
            productId: "com.sk.bNet.app.personal12month",
            createdAt: serverTimestamp(),
          });
          created++;
        }
      }

      setMessage(`チェックしたユーザー数: ${checked}\n新規に作成したサブスク数: ${created}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleRunTeamCampaign = async () => {
    if (
      !confirm(
        "全チームを走査して、subscription が存在しない場合にチーム用キャンペーンサブスクを付与します。実行しますか？"
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const teamsSnap = await getDocs(collection(db, "teams"));

      let checked = 0;
      let created = 0;

      for (const teamDoc of teamsSnap.docs) {
        const teamId = teamDoc.id;
        checked++;

        const subRef = doc(
          db,
          "teams",
          teamId,
          "subscription",
          "iOS"
        );

        const subSnap = await getDoc(subRef);

        if (!subSnap.exists()) {
          await setDoc(subRef, {
            status: "active",
            campaign: "キャンペーン中",
            productId: "com.sk.bNet.teamPlatina.yearly",
            createdAt: serverTimestamp(),
          });
          created++;
        }
      }

      setMessage(
        `チェックしたチーム数: ${checked}\n新規に作成したチームサブスク数: ${created}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCampaignWithoutExpiry = async () => {
    if (
      !confirm(
        "campaign が「キャンペーン中」で、expiryDate が存在しないサブスクを削除します。実行しますか？"
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const usersSnap = await getDocs(collection(db, "users"));

      let checked = 0;
      let deleted = 0;

      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;

        const subColRef = collection(db, "users", userId, "subscription");
        const subSnap = await getDocs(subColRef);

        for (const subDoc of subSnap.docs) {
          checked++;
          const data = subDoc.data();

          const isCampaign = data["campaign"] === "キャンペーン中";
          const hasExpiry = data["expiryDate"] != null;

          if (isCampaign && !hasExpiry) {
            await deleteDoc(subDoc.ref);
            deleted++;
          }
        }
      }

      setMessage(
        `チェックしたサブスク数: ${checked}\n削除したサブスク数: ${deleted}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeTeamCampaignWithoutExpiry = async () => {
    if (
      !confirm(
        "campaign が「キャンペーン中」で、expiryDate が存在しないチームサブスクを削除します。実行しますか？"
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const teamsSnap = await getDocs(collection(db, "teams"));

      let checked = 0;
      let deleted = 0;

      for (const teamDoc of teamsSnap.docs) {
        const teamId = teamDoc.id;

        const subColRef = collection(db, "teams", teamId, "subscription");
        const subSnap = await getDocs(subColRef);

        for (const subDoc of subSnap.docs) {
          checked++;
          const data = subDoc.data();

          const isCampaign = data["campaign"] === "キャンペーン中";
          const hasExpiry = data["expiryDate"] != null;

          if (isCampaign && !hasExpiry) {
            await deleteDoc(subDoc.ref);
            deleted++;
          }
        }
      }

      setMessage(
        `チェックしたチームサブスク数: ${checked}\n削除したチームサブスク数: ${deleted}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminHeader active="event" />

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
        <h1 className="text-xl font-semibold text-zinc-900">イベント管理</h1>

        <section className="mt-6 space-y-4">
          {/* 個人（ユーザー）向けキャンペーン操作 */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-semibold text-zinc-800">
              個人ユーザー向けリリースキャンペーン
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              users コレクション配下の subscriptionに対して、キャンペーン用のサブスク付与／削除を行います。
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRunCampaign}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 cursor-pointer"
              >
                {loading ? "実行中..." : "個人サブスク付与を実行する"}
              </button>

              <button
                type="button"
                onClick={handleRevokeCampaignWithoutExpiry}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300 cursor-pointer"
              >
                {loading
                  ? "実行中..."
                  : "個人キャンペーンサブスクを削除する"}
              </button>
            </div>
          </div>

          {/* チーム向けキャンペーン操作 */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-base font-semibold text-zinc-800">
              チーム向けリリースキャンペーン
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              teams コレクション配下の subscriptionに対して、キャンペーン用のサブスク付与／削除を行います。
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRunTeamCampaign}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300 cursor-pointer"
              >
                {loading ? "実行中..." : "チームサブスク付与を実行する"}
              </button>

              <button
                type="button"
                onClick={handleRevokeTeamCampaignWithoutExpiry}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-red-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-900 disabled:cursor-not-allowed disabled:bg-red-300 cursor-pointer"
              >
                {loading
                  ? "実行中..."
                  : "チームキャンペーンサブスクを削除する"}
              </button>
            </div>
          </div>

          {message && (
            <p className="mt-3 text-xs text-green-600 whitespace-pre-wrap">{message}</p>
          )}
          {error && (
            <p className="mt-3 text-xs text-red-600 whitespace-pre-wrap">{error}</p>
          )}
        </section>
      </main>
    </div>
  );
}