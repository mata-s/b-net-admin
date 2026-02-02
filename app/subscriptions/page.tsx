

"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "@/app/lib/firebaseClient";
import {
  collection,
  getDocs,
  DocumentData,
} from "firebase/firestore";
import { AdminHeader } from "@/app/components/AdminHeader";

// ---- Product ID 定義 ----
const PERSONAL_MONTHLY_IDS = [
  "com.sk.bNet.app.personal1month",
  "com.sk.bnet.app.personal:personal-monthly",
];

const PERSONAL_YEARLY_IDS = [
  "com.sk.bNet.app.personal12month",
  "com.sk.bnet.app.personal:personal-yearly",
];

const TEAM_GOLD_MONTHLY_IDS = [
  "com.sk.bnet.team:gold-monthly",
  "com.sk.bNet.teamGold.monthly",
];

const TEAM_PLATINA_MONTHLY_IDS = [
  "com.sk.bnet.team:platina-monthly",
  "com.sk.bNet.teamPlatina.monthly",
];

const TEAM_GOLD_YEARLY_IDS = [
  "com.sk.bnet.team:gold-yearly",
  "com.sk.bNet.teamGold.yearly",
];

const TEAM_PLATINA_YEARLY_IDS = [
  "com.sk.bnet.team:platina-yearly",
  "com.sk.bNet.teamPlatina.yearly",
];

// ---- 価格設定（円） ----
const PERSONAL_MONTHLY_PRICE = 580;
const PERSONAL_YEARLY_PRICE = 6000;

const TEAM_GOLD_MONTHLY_PRICE = 1500;
const TEAM_PLATINA_MONTHLY_PRICE = 16000;

const TEAM_GOLD_YEARLY_PRICE = 1800;
const TEAM_PLATINA_YEARLY_PRICE = 19400;

// ---- 型定義 ----
interface SubscriptionStats {
  // 個人
  userMonthlyCount: number;
  userYearlyCount: number;
  userMonthlyRevenue: number; // 年プランを月換算含めた見込み
  userYearlyRevenue: number; // 12ヶ月想定の年間売上

  // チーム（ゴールド）
  teamGoldMonthlyCount: number;
  teamGoldYearlyCount: number;
  teamGoldMonthlyRevenue: number;
  teamGoldYearlyRevenue: number;

  // チーム（プラチナ）
  teamPlatinaMonthlyCount: number;
  teamPlatinaYearlyCount: number;
  teamPlatinaMonthlyRevenue: number;
  teamPlatinaYearlyRevenue: number;

  // 追加: 全ユーザー数・全チーム数
  totalUserCount: number;
  totalTeamCount: number;
}

const initialStats: SubscriptionStats = {
  userMonthlyCount: 0,
  userYearlyCount: 0,
  userMonthlyRevenue: 0,
  userYearlyRevenue: 0,

  teamGoldMonthlyCount: 0,
  teamGoldYearlyCount: 0,
  teamGoldMonthlyRevenue: 0,
  teamGoldYearlyRevenue: 0,

  teamPlatinaMonthlyCount: 0,
  teamPlatinaYearlyCount: 0,
  teamPlatinaMonthlyRevenue: 0,
  teamPlatinaYearlyRevenue: 0,
  totalUserCount: 0,
  totalTeamCount: 0,
};

function isActiveSub(doc: DocumentData): boolean {
  const status = doc.status ?? doc.state ?? doc.subscriptionStatus;
  return status === "active";
}

export default function SubscriptionsPage() {
  const [stats, setStats] = useState<SubscriptionStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // カウンタ
      let userMonthlyCount = 0;
      let userYearlyCount = 0;

      let teamGoldMonthlyCount = 0;
      let teamGoldYearlyCount = 0;

      let teamPlatinaMonthlyCount = 0;
      let teamPlatinaYearlyCount = 0;

      try {
        // ---- ユーザーサブスク ----
        const usersSnap = await getDocs(collection(db, "users"));
        const totalUserCount = usersSnap.size;

        for (const userDoc of usersSnap.docs) {
          const subsSnap = await getDocs(
            collection(db, "users", userDoc.id, "subscription")
          );

          subsSnap.forEach((subDoc) => {
            const data = subDoc.data();
            if (!isActiveSub(data)) return;

            const productId: string | undefined = data.productId;
            if (!productId) return;

            if (PERSONAL_MONTHLY_IDS.includes(productId)) {
              userMonthlyCount += 1;
            } else if (PERSONAL_YEARLY_IDS.includes(productId)) {
              userYearlyCount += 1;
            }
          });
        }

        // ---- チームサブスク ----
        const teamsSnap = await getDocs(collection(db, "teams"));
        const totalTeamCount = teamsSnap.size;

        for (const teamDoc of teamsSnap.docs) {
          const subsSnap = await getDocs(
            collection(db, "teams", teamDoc.id, "subscription")
          );

          subsSnap.forEach((subDoc) => {
            const data = subDoc.data();
            if (!isActiveSub(data)) return;

            const productId: string | undefined = data.productId;
            if (!productId) return;

            if (TEAM_GOLD_MONTHLY_IDS.includes(productId)) {
              teamGoldMonthlyCount += 1;
            } else if (TEAM_GOLD_YEARLY_IDS.includes(productId)) {
              teamGoldYearlyCount += 1;
            } else if (TEAM_PLATINA_MONTHLY_IDS.includes(productId)) {
              teamPlatinaMonthlyCount += 1;
            } else if (TEAM_PLATINA_YEARLY_IDS.includes(productId)) {
              teamPlatinaYearlyCount += 1;
            }
          });
        }

        // ---- 売上計算 ----
        const userMonthlyRevenue = Math.floor(
          userMonthlyCount * PERSONAL_MONTHLY_PRICE +
          (userYearlyCount * PERSONAL_YEARLY_PRICE) / 12
        );

        const userYearlyRevenue =
          userMonthlyCount * PERSONAL_MONTHLY_PRICE * 12 +
          userYearlyCount * PERSONAL_YEARLY_PRICE;

        const teamGoldMonthlyRevenue = Math.floor(
          teamGoldMonthlyCount * TEAM_GOLD_MONTHLY_PRICE +
          (teamGoldYearlyCount * TEAM_GOLD_YEARLY_PRICE) / 12
        );

        const teamGoldYearlyRevenue =
          teamGoldMonthlyCount * TEAM_GOLD_MONTHLY_PRICE * 12 +
          teamGoldYearlyCount * TEAM_GOLD_YEARLY_PRICE;

        const teamPlatinaMonthlyRevenue = Math.floor(
          teamPlatinaMonthlyCount * TEAM_PLATINA_MONTHLY_PRICE +
          (teamPlatinaYearlyCount * TEAM_PLATINA_YEARLY_PRICE) / 12
        );

        const teamPlatinaYearlyRevenue =
          teamPlatinaMonthlyCount * TEAM_PLATINA_MONTHLY_PRICE * 12 +
          teamPlatinaYearlyCount * TEAM_PLATINA_YEARLY_PRICE;

        setStats({
          userMonthlyCount,
          userYearlyCount,
          userMonthlyRevenue,
          userYearlyRevenue,
          teamGoldMonthlyCount,
          teamGoldYearlyCount,
          teamGoldMonthlyRevenue,
          teamGoldYearlyRevenue,
          teamPlatinaMonthlyCount,
          teamPlatinaYearlyCount,
          teamPlatinaMonthlyRevenue,
          teamPlatinaYearlyRevenue,
          totalUserCount,
          totalTeamCount,
        });
      } catch (e) {
        console.error(e);
        setError("サブスクリプション情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalMonthlyRevenue =
    stats.userMonthlyRevenue +
    stats.teamGoldMonthlyRevenue +
    stats.teamPlatinaMonthlyRevenue;

  const totalYearlyRevenue =
    stats.userYearlyRevenue +
    stats.teamGoldYearlyRevenue +
    stats.teamPlatinaYearlyRevenue;

  // サブスク契約数
  const totalUserSubCount = stats.userMonthlyCount + stats.userYearlyCount;
  const totalTeamSubCount =
    stats.teamGoldMonthlyCount +
    stats.teamGoldYearlyCount +
    stats.teamPlatinaMonthlyCount +
    stats.teamPlatinaYearlyCount;

  const userSubRate =
    stats.totalUserCount > 0
      ? (totalUserSubCount / stats.totalUserCount) * 100
      : 0;

  const teamSubRate =
    stats.totalTeamCount > 0
      ? (totalTeamSubCount / stats.totalTeamCount) * 100
      : 0;

  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminHeader active="subscriptions" />
      <main className="mx-auto flex w-full flex-col border-y-8 border-zinc-200/60 bg-white sm:max-w-2xl sm:rounded-xl sm:border-8 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
        <div className="container mx-auto px-4 pt-6 lg:px-8 lg:pt-8">
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
            <div className="grow">
              <h1 className="mb-1 text-xl font-bold">サブスクリプション</h1>
              <p className="text-sm font-medium text-zinc-500">
                個人プラン・チームプランの契約数と売上状況を確認。
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-4 lg:p-8">
          {loading && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
              集計中です...
            </div>
          )}

          {error && !loading && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-8">
              {/* 全体サマリー */}
              <section>
                <h2 className="mb-3 text-sm font-semibold text-zinc-600">
                  全体サマリー
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
                    <span className="text-xs font-medium text-zinc-500">
                      月間売上（見込み）
                    </span>
                    <span className="mt-2 text-2xl font-bold">
                      ￥{Math.floor(totalMonthlyRevenue).toLocaleString()}
                    </span>
                    <span className="mt-1 text-xs text-zinc-500">
                      年プランを月換算した合計
                    </span>
                  </div>
                  <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
                    <span className="text-xs font-medium text-zinc-500">
                      年間売上（想定）
                    </span>
                    <span className="mt-2 text-2xl font-bold">
                      ￥{totalYearlyRevenue.toLocaleString()}
                    </span>
                    <span className="mt-1 text-xs text-zinc-500">
                      現在の契約が 12 ヶ月継続した場合
                    </span>
                  </div>
                  <div className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
                    <span className="text-xs font-medium text-zinc-500">
                      契約件数
                    </span>
                    <span className="mt-2 text-2xl font-bold">
                      {totalUserSubCount + totalTeamSubCount}件
                    </span>
                    <span className="mt-1 text-xs text-zinc-500">
                      個人＋チームのサブスク契約数
                    </span>
                  </div>
                </div>
                <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
                  <h3 className="text-xs font-semibold tracking-wide text-zinc-500">
                    サブスク率
                  </h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-zinc-500">
                        ユーザーサブスク率
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {userSubRate.toFixed(1)}%
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        （{totalUserSubCount} / {stats.totalUserCount} ユーザー）
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500">
                        チームサブスク率
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {teamSubRate.toFixed(1)}%
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        （{totalTeamSubCount} / {stats.totalTeamCount} チーム）
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 個人プラン */}
              <section>
                <h2 className="mb-3 text-sm font-semibold text-zinc-600">
                  個人プラン
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      月額プラン
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {stats.userMonthlyCount} 件
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      ￥{PERSONAL_MONTHLY_PRICE.toLocaleString()} / 月
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      年額プラン
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {stats.userYearlyCount} 件
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      ￥{PERSONAL_YEARLY_PRICE.toLocaleString()} / 年
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      売上
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      月：￥{Math.floor(stats.userMonthlyRevenue).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      ※ 年額プランを月換算した見込み金額
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      年：￥{stats.userYearlyRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>

              {/* チームプラン - ゴールド */}
              <section>
                <h2 className="mb-3 text-sm font-semibold text-zinc-600">
                  チームプラン（ゴールド）
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      月額プラン
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {stats.teamGoldMonthlyCount} 件
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      ￥{TEAM_GOLD_MONTHLY_PRICE.toLocaleString()} / 月
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      年額プラン
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {stats.teamGoldYearlyCount} 件
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      ￥{TEAM_GOLD_YEARLY_PRICE.toLocaleString()} / 年
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      売上
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      月：￥{Math.floor(stats.teamGoldMonthlyRevenue).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      ※ 年額プランを月換算した見込み金額
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      年：￥{stats.teamGoldYearlyRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>

              {/* チームプラン - プラチナ */}
              <section>
                <h2 className="mb-3 text-sm font-semibold text-zinc-600">
                  チームプラン（プラチナ）
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      月額プラン
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {stats.teamPlatinaMonthlyCount} 件
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      ￥{TEAM_PLATINA_MONTHLY_PRICE.toLocaleString()} / 月
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      年額プラン
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {stats.teamPlatinaYearlyCount} 件
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      ￥{TEAM_PLATINA_YEARLY_PRICE.toLocaleString()} / 年
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <p className="text-xs font-medium text-zinc-500">
                      売上
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      月：￥{Math.floor(stats.teamPlatinaMonthlyRevenue).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      ※ 年額プランを月換算した見込み金額
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      年：￥{stats.teamPlatinaYearlyRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}