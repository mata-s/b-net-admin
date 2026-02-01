// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const Bar = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Bar),
  { ssr: false }
);
const Line = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Line),
  { ssr: false }
);
import { db } from "@/app/lib/firebaseClient";
import { auth } from "@/app/lib/firebaseClient";
import { AdminHeader } from "@/app/components/AdminHeader";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
  collectionGroup,
  getDocs,
} from "firebase/firestore";

export default function DashboardPage() {
  const router = useRouter();

  const [userCount, setUserCount] = useState<number | null>(null);
  const [teamCount, setTeamCount] = useState<number | null>(null);

  const [userMonthlyIncrease, setUserMonthlyIncrease] = useState<number | null>(null);
  const [teamMonthlyIncrease, setTeamMonthlyIncrease] = useState<number | null>(null);

  // ユーザーの有料サブスク集計
  const [userSubMonthlyCount, setUserSubMonthlyCount] = useState<number | null>(null);
  const [userSubYearlyCount, setUserSubYearlyCount] = useState<number | null>(null);
  const [userSubTotalCount, setUserSubTotalCount] = useState<number | null>(null);
  const [userSubMonthlyTotal, setUserSubMonthlyTotal] = useState<number | null>(null);
  const [userSubYearlyTotal, setUserSubYearlyTotal] = useState<number | null>(null);
  const [userSubTotalAmount, setUserSubTotalAmount] = useState<number | null>(null);

  // チームの有料サブスク集計
  const [teamSubGoldMonthlyCount, setTeamSubGoldMonthlyCount] = useState<number | null>(null);
  const [teamSubPlatinaMonthlyCount, setTeamSubPlatinaMonthlyCount] = useState<number | null>(null);
  const [teamSubGoldYearlyCount, setTeamSubGoldYearlyCount] = useState<number | null>(null);
  const [teamSubPlatinaYearlyCount, setTeamSubPlatinaYearlyCount] = useState<number | null>(null);

  const [teamSubMonthlyTotalCount, setTeamSubMonthlyTotalCount] = useState<number | null>(null);
  const [teamSubYearlyTotalCount, setTeamSubYearlyTotalCount] = useState<number | null>(null);
  const [teamSubTotalCount, setTeamSubTotalCount] = useState<number | null>(null);

  const [teamSubMonthlyTotalAmount, setTeamSubMonthlyTotalAmount] = useState<number | null>(null);
  const [teamSubYearlyTotalAmount, setTeamSubYearlyTotalAmount] = useState<number | null>(null);
  const [teamSubTotalAmount, setTeamSubTotalAmount] = useState<number | null>(null);
  const [allSubTotalAmount, setAllSubTotalAmount] = useState<number | null>(null);

  // 直近6ヶ月グラフ用
  const [last6MonthsLabels, setLast6MonthsLabels] = useState<string[]>([]);
  const [last6MonthsRevenue, setLast6MonthsRevenue] = useState<number[]>([]);
  const [last6MonthsUserCounts, setLast6MonthsUserCounts] = useState<number[]>([]);

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // 認証チェック
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // 未ログイン → /login へ
        router.push("/login");
      } else {
        // ログイン済みなら統計取得
        fetchStats();
      }
      setAuthChecked(true);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      // 合計ユーザー・合計チーム
      const usersSnap = await getCountFromServer(collection(db, "users"));
      const teamsSnap = await getCountFromServer(collection(db, "teams"));

      setUserCount(usersSnap.data().count);
      setTeamCount(teamsSnap.data().count);

      // === 今月の開始と来月の開始 ===
      const now = new Date();

      // 今月 1日 0:00
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

      // 来月 1日 0:00（< 来月1日 で範囲指定するため）
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
        0,
        0,
        0
      );

      const thisMonthStartTs = Timestamp.fromDate(startOfThisMonth);
      const nextMonthStartTs = Timestamp.fromDate(startOfNextMonth);

      // === 今月作成された users の数 ===
      const usersThisMonthQuery = query(
        collection(db, "users"),
        where("createdAt", ">=", thisMonthStartTs),
        where("createdAt", "<", nextMonthStartTs)
      );
      const usersThisMonthSnap = await getCountFromServer(usersThisMonthQuery);

      // === 今月作成された teams の数 ===
      const teamsThisMonthQuery = query(
        collection(db, "teams"),
        where("createdAt", ">=", thisMonthStartTs),
        where("createdAt", "<", nextMonthStartTs)
      );
      const teamsThisMonthSnap = await getCountFromServer(teamsThisMonthQuery);

      setUserMonthlyIncrease(usersThisMonthSnap.data().count);
      setTeamMonthlyIncrease(teamsThisMonthSnap.data().count);

      // === ユーザー＆チームの有料サブスク集計 ===
      // まず直近6ヶ月分の月範囲を用意
      type MonthRange = {
        key: string;
        label: string;
        startTs: Timestamp;
        endTs: Timestamp;
      };

      const monthRanges: MonthRange[] = [];
      for (let i = 5; i >= 0; i--) {
        const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(target.getFullYear(), target.getMonth(), 1);
        const end = new Date(target.getFullYear(), target.getMonth() + 1, 1);
        const key = `${target.getFullYear()}-${target.getMonth()}`;
        const label = `${target.getFullYear()}/${target.getMonth() + 1}`;
        monthRanges.push({
          key,
          label,
          startTs: Timestamp.fromDate(start),
          endTs: Timestamp.fromDate(end),
        });
      }

      // 直近6ヶ月のユーザー登録数
      const monthlyUserCounts: number[] = [];
      for (const range of monthRanges) {
        const monthlyUsersQuery = query(
          collection(db, "users"),
          where("createdAt", ">=", range.startTs),
          where("createdAt", "<", range.endTs)
        );
        const monthlyUsersSnap = await getCountFromServer(monthlyUsersQuery);
        monthlyUserCounts.push(monthlyUsersSnap.data().count);
      }

      const monthKeyToIndex: Record<string, number> = {};
      monthRanges.forEach((range, index) => {
        monthKeyToIndex[range.key] = index;
      });
      const monthlyRevenue: number[] = new Array(monthRanges.length).fill(0);

      // users/{userId}/subscription/{platform}
      // teams/{teamId}/subscription/{platform}
      const subQuery = query(
        collectionGroup(db, "subscription"),
        where("status", "==", "active")
      );
      const subSnap = await getDocs(subQuery);

      // ユーザー用プロダクトID
      const userMonthlyProductIds = new Set<string>([
        "com.sk.bNet.app.personal1month",
        "com.sk.bnet.app.personal:personal-monthly",
      ]);
      const userYearlyProductIds = new Set<string>([
        "com.sk.bNet.app.personal12month",
        "com.sk.bnet.app.personal:personal-yearly",
      ]);

      // チーム用プロダクトID
      const teamGoldMonthlyIds = new Set<string>([
        "com.sk.bnet.team:gold-monthly",
        "com.sk.bNet.teamGold.monthly",
      ]);
      const teamPlatinaMonthlyIds = new Set<string>([
        "com.sk.bnet.team:platina-monthly",
        "com.sk.bNet.teamPlatina.monthly",
      ]);
      const teamGoldYearlyIds = new Set<string>([
        "com.sk.bnet.team:gold-yearly",
        "com.sk.bNet.teamGold.yearly",
      ]);
      const teamPlatinaYearlyIds = new Set<string>([
        "com.sk.bnet.team:platina-yearly",
        "com.sk.bNet.teamPlatina.yearly",
      ]);

      // ユーザーサブスク集計用
      let userMonthlyCount = 0;
      let userYearlyCount = 0;

      // チームサブスク集計用
      let teamGoldMonthlyCount = 0;
      let teamPlatinaMonthlyCount = 0;
      let teamGoldYearlyCount = 0;
      let teamPlatinaYearlyCount = 0;

      // ==== ユーザー（個人）サブスクの金額計算（MRR：年額は12ヶ月で按分） ====
      const USER_MONTHLY_PRICE = 580; // 月額 580円
      const USER_YEARLY_PRICE = 6000; // 年額 6000円

      // ==== チームサブスクの金額計算（MRR：年額は12ヶ月で按分） ====
      const TEAM_GOLD_MONTHLY_PRICE = 1500; // ゴールド月額
      const TEAM_PLATINA_MONTHLY_PRICE = 16000; // プラチナ月額
      const TEAM_GOLD_YEARLY_PRICE = 1800; // ゴールド年額
      const TEAM_PLATINA_YEARLY_PRICE = 19400; // プラチナ年額

      subSnap.forEach((doc) => {
        const data = doc.data() as {
          productId?: string;
          status?: string;
          createdAt?: Timestamp;
        };
        const productId = data.productId;
        if (!productId) return;

        const path = doc.ref.path; // 例: "users/xxx/subscription/ios" or "teams/yyy/subscription/android"
        const isUser = path.startsWith("users/") || path.includes("/users/");
        const isTeam = path.startsWith("teams/") || path.includes("/teams/");

        let contribution = 0;

        // ---- ユーザー個人サブスク ----
        if (isUser) {
          if (userMonthlyProductIds.has(productId)) {
            userMonthlyCount += 1;
            contribution = USER_MONTHLY_PRICE;
          } else if (userYearlyProductIds.has(productId)) {
            userYearlyCount += 1;
            contribution = USER_YEARLY_PRICE / 12;
          }
        }

        // ---- チームサブスク ----
        if (isTeam) {
          if (teamGoldMonthlyIds.has(productId)) {
            teamGoldMonthlyCount += 1;
            contribution = TEAM_GOLD_MONTHLY_PRICE;
          } else if (teamPlatinaMonthlyIds.has(productId)) {
            teamPlatinaMonthlyCount += 1;
            contribution = TEAM_PLATINA_MONTHLY_PRICE;
          } else if (teamGoldYearlyIds.has(productId)) {
            teamGoldYearlyCount += 1;
            contribution = TEAM_GOLD_YEARLY_PRICE / 12;
          } else if (teamPlatinaYearlyIds.has(productId)) {
            teamPlatinaYearlyCount += 1;
            contribution = TEAM_PLATINA_YEARLY_PRICE / 12;
          }
        }

        // 売上推移（直近6ヶ月）用の集計
        const createdAt = data.createdAt;
        if (createdAt && contribution > 0) {
          const d = createdAt.toDate();
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const index = monthKeyToIndex[key];
          if (index !== undefined) {
            monthlyRevenue[index] += contribution;
          }
        }
      });

      // ユーザー（個人）サブスクのトータル
      const userMonthlyTotal = userMonthlyCount * USER_MONTHLY_PRICE;
      const userYearlyTotal = userYearlyCount * (USER_YEARLY_PRICE / 12);
      const userTotalCount = userMonthlyCount + userYearlyCount;
      const userTotalAmount = userMonthlyTotal + userYearlyTotal;

      setUserSubMonthlyCount(userMonthlyCount);
      setUserSubYearlyCount(userYearlyCount);
      setUserSubTotalCount(userTotalCount);
      setUserSubMonthlyTotal(userMonthlyTotal);
      setUserSubYearlyTotal(userYearlyTotal);
      setUserSubTotalAmount(userTotalAmount);

      // チームサブスク（ゴールド／プラチナ）のトータル
      const teamMonthlyTotalAmount =
        teamGoldMonthlyCount * TEAM_GOLD_MONTHLY_PRICE +
        teamPlatinaMonthlyCount * TEAM_PLATINA_MONTHLY_PRICE;

      const teamYearlyTotalAmount =
        teamGoldYearlyCount * (TEAM_GOLD_YEARLY_PRICE / 12) +
        teamPlatinaYearlyCount * (TEAM_PLATINA_YEARLY_PRICE / 12);

      const teamMonthlyTotalCount =
        teamGoldMonthlyCount + teamPlatinaMonthlyCount;
      const teamYearlyTotalCount =
        teamGoldYearlyCount + teamPlatinaYearlyCount;

      const teamTotalCount =
        teamMonthlyTotalCount + teamYearlyTotalCount;
      const teamTotalAmount =
        teamMonthlyTotalAmount + teamYearlyTotalAmount;

      setTeamSubGoldMonthlyCount(teamGoldMonthlyCount);
      setTeamSubPlatinaMonthlyCount(teamPlatinaMonthlyCount);
      setTeamSubGoldYearlyCount(teamGoldYearlyCount);
      setTeamSubPlatinaYearlyCount(teamPlatinaYearlyCount);

      setTeamSubMonthlyTotalCount(teamMonthlyTotalCount);
      setTeamSubYearlyTotalCount(teamYearlyTotalCount);
      setTeamSubTotalCount(teamTotalCount);

      setTeamSubMonthlyTotalAmount(teamMonthlyTotalAmount);
      setTeamSubYearlyTotalAmount(teamYearlyTotalAmount);
      setTeamSubTotalAmount(teamTotalAmount);

      // ==== ユーザー＋チーム 合算売上（金額） ====
      const allTotalAmount = userTotalAmount + teamTotalAmount;
      setAllSubTotalAmount(allTotalAmount);

      // グラフ用の状態を更新（直近6ヶ月）
      setLast6MonthsLabels(monthRanges.map((range) => range.label));
      setLast6MonthsRevenue(monthlyRevenue);
      setLast6MonthsUserCounts(monthlyUserCounts);
    } catch (e) {
      console.error("ダッシュボード用の統計取得に失敗しました", e);
    }
  };

  if (!authChecked) {
    // 認証状態がわかるまで簡単なローディング
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full min-w-[320px] flex-col bg-zinc-100">
      <AdminHeader active="dashboard" />

      {/* メイン */}
      <main className="mx-auto flex w-full flex-auto flex-col border-y-8 border-zinc-200/60 bg-white sm:max-w-2xl sm:rounded-xl sm:border-8 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
        <div className="container mx-auto px-4 pt-6 lg:px-8 lg:pt-8">
          {/* 見出し */}
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
            <div className="grow">
              <h1 className="mb-1 text-xl font-bold">Dashboard</h1>
              <h2 className="text-sm font-medium text-zinc-500">
                登録ユーザー
                <strong> {userCount !== null ? `${userCount}人` : " 読み込み中"}</strong>
                {" / "}
                チーム
                <strong> {teamCount !== null ? `${teamCount}チーム` : " 読み込み中"}</strong>
              </h2>
              <p className="mt-1 text-xs font-medium text-zinc-500">
                ユーザー＋チームのサブスク売上見込み合計：
                <strong>
                  {" "}
                  {allSubTotalAmount !== null
                    ? `¥${allSubTotalAmount.toLocaleString()}`
                    : "集計中..."}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* 上の4カードだけサンプル */}
        <div className="container mx-auto p-4 lg:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <StatCard
              label="登録ユーザー"
              value={userCount !== null ? userCount : "-"}
              footer={
                userMonthlyIncrease !== null
                ? `今月 +${userMonthlyIncrease}`
                : "今月 分析中..."
              }
            />
            <StatCard
              label="チーム数"
              value={teamCount !== null ? teamCount : "-"}
              footer={
                teamMonthlyIncrease !== null
                ? `今月 +${teamMonthlyIncrease}`
                : "今月 分析中..."
              }
            />
            {/* 件数カード */}
            <StatCard
            label="有料サブスク（ユーザー）"
            value={
              userSubTotalCount !== null
              ? `${userSubTotalCount}件`
              : "-"
            }
            footer={
              userSubMonthlyCount !== null &&
              userSubYearlyCount !== null
              ? `月 ${userSubMonthlyCount}件 / 年 ${userSubYearlyCount}件`
              : "サブスク件数 集計中..."
            }
          />
          {/* 売上カード */}
          <StatCard
            label="サブスク売上（月換算・ユーザー）"
            value={
              userSubTotalAmount !== null
                ? `¥${userSubTotalAmount.toLocaleString()}`
                : "-"
            }
            footer={
              userSubMonthlyTotal !== null && userSubYearlyTotal !== null
                ? `月プラン ¥${userSubMonthlyTotal.toLocaleString()} / 年プラン(月換算) ¥${userSubYearlyTotal.toLocaleString()}`
                : "売上（月換算）集計中..."
            }
          />
        {/* チームサブスク（ゴールド）件数カード */}
        <StatCard
        label="有料サブスク（チーム：ゴールド）"
        value={
          teamSubGoldMonthlyCount !== null &&
          teamSubGoldYearlyCount !== null
          ? `${teamSubGoldMonthlyCount + teamSubGoldYearlyCount}件`
          : "-"
        }
        footer={
          teamSubGoldMonthlyCount !== null &&
          teamSubGoldYearlyCount !== null
          ? `月 ${teamSubGoldMonthlyCount}件 / 年 ${teamSubGoldYearlyCount}件`
          : "ゴールドサブスク件数 集計中..."
          }
        />
        
        {/* チームサブスク（プラチナ）件数カード */}
        <StatCard
        label="有料サブスク（チーム：プラチナ）"
        value={
          teamSubPlatinaMonthlyCount !== null &&
          teamSubPlatinaYearlyCount !== null
          ? `${teamSubPlatinaMonthlyCount + teamSubPlatinaYearlyCount}件`
          : "-"
        }
        footer={
          teamSubPlatinaMonthlyCount !== null &&
          teamSubPlatinaYearlyCount !== null
          ? `月 ${teamSubPlatinaMonthlyCount}件 / 年 ${teamSubPlatinaYearlyCount}件`
          : "プラチナサブスク件数 集計中..."
        }
      />
      
      {/* チームサブスク（ゴールド）売上カード（月換算） */}
      <StatCard
        label="サブスク売上（月換算・チーム：ゴールド）"
        value={
          teamSubGoldMonthlyCount !== null &&
          teamSubGoldYearlyCount !== null
            ? `¥${(
                teamSubGoldMonthlyCount * 1500 +
                teamSubGoldYearlyCount * (1800 / 12)
              ).toLocaleString()}`
            : "-"
        }
        footer={
          teamSubGoldMonthlyCount !== null &&
          teamSubGoldYearlyCount !== null
            ? `月 ¥${(teamSubGoldMonthlyCount * 1500).toLocaleString()} / 年(月換算) ¥${(
                teamSubGoldYearlyCount * (1800 / 12)
              ).toLocaleString()}`
            : "ゴールド売上（月換算）集計中..."
        }
      />
      
      {/* チームサブスク（プラチナ）売上カード（月換算） */}
      <StatCard
        label="サブスク売上（月換算・チーム：プラチナ）"
        value={
          teamSubPlatinaMonthlyCount !== null &&
          teamSubPlatinaYearlyCount !== null
            ? `¥${(
                teamSubPlatinaMonthlyCount * 16000 +
                teamSubPlatinaYearlyCount * (19400 / 12)
              ).toLocaleString()}`
            : "-"
        }
        footer={
          teamSubPlatinaMonthlyCount !== null &&
          teamSubPlatinaYearlyCount !== null
            ? `月 ¥${(teamSubPlatinaMonthlyCount * 16000).toLocaleString()} / 年(月換算) ¥${(
                teamSubPlatinaYearlyCount * (19400 / 12)
              ).toLocaleString()}`
            : "プラチナ売上（月換算）集計中..."
        }
      />
      {/* チームサブスク（ゴールド＋プラチナ 合算）売上カード（月換算） */}
      <StatCard
        label="サブスク売上（月換算・チーム合計）"
        value={
          teamSubTotalAmount !== null
            ? `¥${teamSubTotalAmount.toLocaleString()}`
            : "-"
        }
        footer={
          teamSubMonthlyTotalAmount !== null &&
          teamSubYearlyTotalAmount !== null
            ? `月合計 ¥${teamSubMonthlyTotalAmount.toLocaleString()} / 年(月換算)合計 ¥${teamSubYearlyTotalAmount.toLocaleString()}`
            : "チーム売上（月換算）集計中..."
        }
      />
          </div>
        </div>
        {/* グラフエリア */}
        <div className="container mx-auto px-4 pb-8 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 売上推移（直近6ヶ月） */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                直近6ヶ月の売上推移（ユーザー＋チーム合算）
              </h3>
              {last6MonthsLabels.length > 0 ? (
                <div className="h-56">
                  <Bar
                    data={{
                      labels: last6MonthsLabels,
                      datasets: [
                        {
                          label: "月換算売上（円）",
                          data: last6MonthsRevenue,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          ticks: {
                            callback: (value) =>
                              `¥${Number(value).toLocaleString()}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs text-zinc-500">売上データ集計中...</p>
              )}
            </div>

            {/* 登録ユーザー数推移（直近6ヶ月） */}
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">
                直近6ヶ月の登録ユーザー数推移
              </h3>
              {last6MonthsLabels.length > 0 ? (
                <div className="h-56">
                  <Line
                    data={{
                      labels: last6MonthsLabels,
                      datasets: [
                        {
                          label: "新規登録ユーザー数",
                          data: last6MonthsUserCounts,
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <p className="text-xs text-zinc-500">ユーザーデータ集計中...</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  footer: string;
};

function StatCard({ label, value, footer }: StatCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50/50">
      <div className="flex grow items-center justify-between p-5">
        <dl>
          <dt className="text-2xl font-bold">{value}</dt>
          <dd className="text-sm font-medium text-zinc-500">{label}</dd>
        </dl>
      </div>
      <div className="border-t border-zinc-100 px-5 py-3 text-xs font-medium text-emerald-500">
        {footer}
      </div>
    </div>
  );
}