

'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from "@/app/lib/firebaseClient";
import { AdminHeader } from "@/app/components/AdminHeader";

type Report = {
  id: string;
  contentType: string;
  reason: string;
  details: string;
  reportedUserId: string;
  reporterUserId: string;
  createdAt: Timestamp;
};

const REASON_LABELS: Record<string, string> = {
  inappropriate: '不適切な内容',
  spam: 'スパム',
  abuse: '暴言・嫌がらせ',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  user_profile: 'ユーザー',
  team_profile: 'チーム',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const list: Report[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Report, 'id'>),
      }));

      setReports(list);
      setLoading(false);
    };

    fetchReports();
  }, []);

  return (
    <div className="p-6">
      <AdminHeader active="notification"/>
      <div className="container mx-auto px-4 pt-6 lg:px-8 lg:pt-8">
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
            <div className="grow">
              <h1 className="mb-1 text-xl font-bold">通報一覧</h1>
            </div>
          </div>
        </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">読み込み中...</p>
      ) : reports.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">通報はありません</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 text-left">通報日時</th>
                <th className="border px-3 py-2 text-left">対象</th>
                <th className="border px-3 py-2 text-left">理由</th>
                <th className="border px-3 py-2 text-left">詳細</th>
                <th className="border px-3 py-2 text-left">通報対象UID</th>
                <th className="border px-3 py-2 text-left">通報者UID</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 whitespace-nowrap">
                    {r.createdAt?.toDate().toLocaleString()}
                  </td>
                  <td className="border px-3 py-2">
                    {CONTENT_TYPE_LABELS[r.contentType] ?? r.contentType}
                  </td>
                  <td className="border px-3 py-2">{REASON_LABELS[r.reason] ?? r.reason}</td>
                  <td className="border px-3 py-2 max-w-md truncate" title={r.details}>
                    {r.details}
                  </td>
                  <td className="border px-3 py-2 font-mono text-xs">
                    {r.reportedUserId}
                  </td>
                  <td className="border px-3 py-2 font-mono text-xs">
                    {r.reporterUserId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}