import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award } from 'lucide-react';

interface RankingUser {
  id: number;
  nickname: string;
  department?: string;
  points: number;
}

interface DepartmentRanking {
  department: string;
  points: number;
  userCount: number;
}

export default function Ranking() {
  const [totalRanking, setTotalRanking] = useState<RankingUser[]>([]);
  const [departmentRanking, setDepartmentRanking] = useState<DepartmentRanking[]>([]);
  const [categoryRankings, setCategoryRankings] = useState<Record<string, RankingUser[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRanking();
    // 5초마다 랭킹 갱신
    const interval = setInterval(fetchRanking, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRanking = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/ranking/all');
      console.log('Ranking API response:', response.data);
      
      setTotalRanking(response.data.total || []);
      setDepartmentRanking(response.data.department || []);
      setCategoryRankings(response.data.categories || {});
    } catch (error: any) {
      console.error('Failed to fetch ranking:', error);
      setError(error.response?.data?.error || error.message || '랭킹을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-red-100 border-red-300';
    if (rank === 2) return 'bg-orange-100 border-orange-300';
    if (rank === 3) return 'bg-yellow-100 border-yellow-300';
    if (rank === 4) return 'bg-green-100 border-green-300';
    if (rank === 5) return 'bg-blue-100 border-blue-300';
    if (rank === 6) return 'bg-indigo-100 border-indigo-300';
    if (rank === 7) return 'bg-purple-100 border-purple-300';
    return 'bg-white border-gray-200';
  };

  const renderRankingTable = (
    title: string,
    ranking: RankingUser[] | DepartmentRanking[],
    isDepartment: boolean = false
  ) => {

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-3">
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  순위
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {isDepartment ? '부서' : '닉네임'}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  점수
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                ranking.slice(0, 10).map((item, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;

                  return (
                    <tr
                      key={isDepartment ? (item as DepartmentRanking).department : (item as RankingUser).id}
                      className={`hover:bg-blue-50 transition-colors ${getRankBackground(rank)}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {isTopThree ? (
                            <>
                              {getRankIcon(rank)}
                              <span className="font-bold text-sm">{rank}위</span>
                            </>
                          ) : (
                            <span className="text-gray-700 font-medium">{rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {isDepartment
                            ? (item as DepartmentRanking).department
                            : (item as RankingUser).nickname}
                        </div>
                        {isDepartment && (
                          <div className="text-xs text-gray-500">
                            {(item as DepartmentRanking).userCount}명
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-blue-600">
                          {item.points.toLocaleString()}P
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">랭킹</h1>
        <p className="text-gray-600">전체 사용자의 포인트 랭킹입니다</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">오류 발생</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchRanking}
            className="mt-2 text-sm underline hover:text-red-800"
          >
            다시 시도
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 부서별 랭킹 */}
        {renderRankingTable('부서', departmentRanking, true)}

        {/* 전체 랭킹 */}
        {renderRankingTable('TOTAL', totalRanking, false)}

        {/* 말씀 랭킹 */}
        {renderRankingTable('말씀', categoryRankings['말씀'] || [], false)}

        {/* 기도 랭킹 */}
        {renderRankingTable('기도', categoryRankings['기도'] || [], false)}

        {/* 교제 랭킹 */}
        {renderRankingTable('교제', categoryRankings['교제'] || [], false)}

        {/* 전도 랭킹 */}
        {renderRankingTable('전도', categoryRankings['전도'] || [], false)}
      </div>
    </div>
  );
}
