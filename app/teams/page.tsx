"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  Timestamp,
  getCountFromServer,
  where,
} from "firebase/firestore";
import { AdminHeader } from "@/app/components/AdminHeader";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);


type TeamDoc = {
  id: string;
  teamName?: string;
  createdBy?: string;
  createdAt?: Timestamp;
  prefecture?: string;
};

export default function TeamsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<TeamDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [monthlyNewUsers, setMonthlyNewUsers] = useState<number | null>(null);
  const [lastMonthlyNewUsers, setLastMonthlyNewUsers] = useState<number | null>(null);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState<number | null>(null);
  const [userGrowthLabels, setUserGrowthLabels] = useState<string[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<number[]>([]);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [prefectureStats, setPrefectureStats] = useState<{ prefecture: string; count: number }[]>([]);
  const [prefectureLoading, setPrefectureLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        fetchUsers();
        fetchSummary();
        fetchUserGrowth();
        fetchPrefectureStats();
      }
      setAuthChecked(true);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fetchPrefectureStats = async () => {
    try {
      setPrefectureLoading(true);
      const usersCol = collection(db, "teams");
      const snap = await getDocs(usersCol);

      const countsMap = new Map<string, number>();

      snap.forEach((doc) => {
        const data = doc.data() as { prefecture?: string };
        const pref = data.prefecture || "未設定";
        const current = countsMap.get(pref) ?? 0;
        countsMap.set(pref, current + 1);
      });

      const statsArray = Array.from(countsMap.entries())
        .map(([prefecture, count]) => ({ prefecture, count }))
        .sort((a, b) => b.count - a.count);

      setPrefectureStats(statsArray);
    } catch (e) {
      console.error("都道府県別ユーザー数の取得に失敗しました", e);
    } finally {
      setPrefectureLoading(false);
    }
  };
  const fetchUserGrowth = async () => {
    try {
      setGrowthLoading(true);
      const usersCol = collection(db, "teams");

      const now = new Date();
      const months: { label: string; start: Date; end: Date }[] = [];

      // 直近6ヶ月（現在の月を含む）
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        const label = `${start.getFullYear()}/${String(
          start.getMonth() + 1
        ).padStart(2, "0")}`;
        months.push({ label, start, end });
      }

      const queries = months.map((m) => {
        const startTs = Timestamp.fromDate(m.start);
        const endTs = Timestamp.fromDate(m.end);
        const q = query(
          usersCol,
          where("createdAt", ">=", startTs),
          where("createdAt", "<", endTs)
        );
        return getCountFromServer(q);
      });

      const snaps = await Promise.all(queries);

      const labels = months.map((m) => m.label);
      const data = snaps.map((s) => s.data().count);

      setUserGrowthLabels(labels);
      setUserGrowthData(data);
    } catch (e) {
      console.error("ユーザー推移取得に失敗しました", e);
    } finally {
      setGrowthLoading(false);
    }
  };

    const fetchSummary = async () => {
  try {
    const usersCol = collection(db, "teams");

    // ✅ 総ユーザー数
    const totalSnap = await getCountFromServer(usersCol);
    setTotalUsers(totalSnap.data().count);

    const now = new Date();
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthTs = Timestamp.fromDate(firstDayOfThisMonth);
    const lastMonthStartTs = Timestamp.fromDate(firstDayOfLastMonth);

    // ✅ 今月の新規ユーザー
    const monthlyQ = query(usersCol, where("createdAt", ">=", thisMonthTs));
    const monthlySnap = await getCountFromServer(monthlyQ);
    const thisMonthCount = monthlySnap.data().count;
    setMonthlyNewUsers(thisMonthCount);

    // ✅ 先月の新規ユーザー (先月1日〜今月1日の前日)
    const lastMonthQ = query(
      usersCol,
      where("createdAt", ">=", lastMonthStartTs),
      where("createdAt", "<", thisMonthTs)
    );
    const lastMonthSnap = await getCountFromServer(lastMonthQ);
    const lastMonthCount = lastMonthSnap.data().count;
    setLastMonthlyNewUsers(lastMonthCount);

    // ✅ 前月比(%) 計算
    if (lastMonthCount > 0) {
      const rate = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
      setMonthlyGrowthRate(rate);
    } else {

      setMonthlyGrowthRate(null);
    }
  } catch (e) {
    console.error("ユーザーサマリー取得に失敗しました", e);
  }
};

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 直近登録順で最大 100 件くらい
      const q = query(
        collection(db, "teams"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);

      const list: TeamDoc[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as {
          teamName?: string;
          createdBy?: string;
          createdAt?: Timestamp;
          prefecture?: string;
        };
        list.push({
          id: doc.id,
          ...data,
        });
      });

      setUsers(list);
    } catch (e) {
      console.error("ユーザー一覧取得に失敗しました", e);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-500">認証確認中...</p>
      </div>
    );
  }


  // 今月のラベル
  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  const userGrowthChartData = {
    labels: userGrowthLabels,
    datasets: [
      {
        label: "新規チーム数",
        data: userGrowthData,
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const userGrowthOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="mx-auto flex min-h-screen w-full min-w-[320px] flex-col bg-zinc-100">
      <AdminHeader active="teams" />

      {/* Main */}
      <main className="mx-auto flex w-full flex-auto flex-col border-y-8 border-zinc-200/60 bg-white sm:max-w-2xl sm:rounded-xl sm:border-8 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
        <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8">

          {/* ✅ サマリーカード */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-medium text-zinc-500">
                総チーム数
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {totalUsers !== null ? `${totalUsers.toLocaleString()}チーム` : "-"}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-medium text-zinc-500">
                {monthLabel} の新規チーム
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {monthlyNewUsers !== null
                  ? `${monthlyNewUsers.toLocaleString()}チーム`
                  : "-"}
              </p>

              {/* 前月比 */}
              {monthlyGrowthRate !== null && lastMonthlyNewUsers !== null && (
                <p className="mt-1 text-xs">
                    <span className="text-zinc-500 mr-1">前月比</span>
                    <span
                    className={
                        monthlyGrowthRate >= 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"
                    }
                >
                    {monthlyGrowthRate >= 0 ? "+" : ""}
                    {monthlyGrowthRate.toFixed(1)}%
                    </span>
                    <span className="ml-1 text-[10px] text-zinc-400">
                        （先月 {lastMonthlyNewUsers.toLocaleString()}チーム）
                    </span>
                </p>
            )}
            </div>
          </div>

          {/* ✅ 直近6ヶ月のユーザー推移グラフ */}
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">
                直近6ヶ月の新規チーム数
              </h2>
              {growthLoading && (
                <span className="text-[10px] text-zinc-400">更新中...</span>
              )}
            </div>
            {userGrowthLabels.length === 0 ? (
              <p className="text-xs text-zinc-500">データがありません。</p>
            ) : (
              <Line data={userGrowthChartData} options={userGrowthOptions} />
            )}
          </div>

          {/* ✅ 都道府県別ユーザー数 */}
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">都道府県別チーム数</h2>
              {prefectureLoading && (
                <span className="text-[10px] text-zinc-400">更新中...</span>
              )}
            </div>
            {prefectureStats.length === 0 ? (
              <p className="text-xs text-zinc-500">都道府県情報がありません。</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-100">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-[11px] font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">都道府県</th>
                      <th className="px-3 py-2">チーム数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {prefectureStats.map((p) => (
                      <tr key={p.prefecture} className="hover:bg-zinc-50">
                        <td className="px-3 py-1.5 text-xs text-zinc-700">
                          {p.prefecture}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-zinc-700">
                          {p.count.toLocaleString()}チーム
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-bold">チーム一覧</h1>
            <p className="text-xs text-zinc-500">
              最大100件まで直近のチームを表示
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">読み込み中...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-zinc-500">ユーザーが見つかりません。</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">チームID</th>
                    <th className="px-4 py-3">チーム名</th>
                    <th className="px-4 py-3">オーナーUID</th>
                    <th className="px-4 py-3">登録日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {users.map((u) => {
                    const teamName = u.teamName ?? "-";
                    const createdBy = u.createdBy ?? "-";
                    const created =
                      u.createdAt?.toDate().toLocaleString("ja-JP") ?? "-";
                    return (
                      <tr key={u.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2 text-xs text-zinc-500">
                          {u.id}
                        </td>
                        <td className="px-4 py-2">{teamName}</td>
                        <td className="px-4 py-2 text-xs text-zinc-500">
                          {createdBy}
                        </td>
                        <td className="px-4 py-2 text-xs text-zinc-500">
                          {created}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}