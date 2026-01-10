import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Target, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface MissionLog {
  id: number;
  completedAt: string;
  mission: {
    id: number;
    title: string;
    description: string;
    points: number;
    category: string;
    icon: string | null;
  };
}

interface LogsByDate {
  date: string;
  logs: MissionLog[];
}

interface MyPageData {
  user: {
    id: number;
    nickname: string;
    department: string;
    totalPoints: number;
  };
  missionLogs: LogsByDate[];
  totalCount: number;
  ranks: {
    total: number;
    말씀: number;
    기도: number;
    교제: number;
    전도: number;
  };
}

export default function MyPage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<MyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyPageData();
  }, []);

  const fetchMyPageData = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/users/mypage');
      setData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch mypage data:', error);
      setError(error.response?.data?.error || '마이페이지 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      말씀: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
      },
      기도: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-300',
      },
      교제: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300',
      },
      전도: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
      },
    };
    return colors[category] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
    };
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return LucideIcons.Target;
    try {
      const IconComponent = (LucideIcons as any)[iconName];
      return IconComponent || LucideIcons.Target;
    } catch {
      return LucideIcons.Target;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  const getCategoryRankText = (rank: number) => {
    return rank > 0 ? `${rank}위` : '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">오류 발생</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchMyPageData}
          className="mt-2 text-sm underline hover:text-red-800"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!data) {
    return <div>데이터가 없습니다.</div>;
  }

  // 모든 미션 로그를 날짜순(오래된 것부터)으로 정렬하여 하나의 배열로 합치기
  const allLogs = data.missionLogs
    .sort((a, b) => a.date.localeCompare(b.date)) // 오래된 날짜가 먼저
    .flatMap((dateGroup) =>
      dateGroup.logs
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()) // 시간순 정렬 (오래된 것부터)
        .map((log) => ({
          ...log,
          date: dateGroup.date,
        }))
    );

  // 카테고리별로 번호 할당 (날짜순으로)
  const categoryCounts: Record<string, number> = {};
  const logsWithNumber = allLogs.map((log) => {
    const category = log.mission.category;
    if (!categoryCounts[category]) {
      categoryCounts[category] = 0;
    }
    categoryCounts[category]++;
    return {
      ...log,
      number: categoryCounts[category],
    };
  });

  return (
    <div>
      {/* 헤더: 제목과 부서 */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">전도챌린지</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs sm:text-sm text-gray-600">부서:</span>
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm sm:text-base font-medium">
            {data.user.department}
          </span>
        </div>
      </div>

      {/* 순위 요약 */}
      <div className="mb-6 sm:mb-8 bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm sm:text-base lg:text-lg">
          <div className="font-semibold text-gray-900">
            TOTAL {getCategoryRankText(data.ranks.total)}
          </div>
          <div className="text-gray-400 hidden sm:inline">|</div>
          <div className="font-semibold text-green-700">
            말씀 {getCategoryRankText(data.ranks.말씀)}
          </div>
          <div className="text-gray-400 hidden sm:inline">|</div>
          <div className="font-semibold text-purple-700">
            기도 {getCategoryRankText(data.ranks.기도)}
          </div>
          <div className="text-gray-400 hidden sm:inline">|</div>
          <div className="font-semibold text-blue-700">
            교제 {getCategoryRankText(data.ranks.교제)}
          </div>
          <div className="text-gray-400 hidden sm:inline">|</div>
          <div className="font-semibold text-red-700">
            전도 {getCategoryRankText(data.ranks.전도)}
          </div>
        </div>
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            <span className="text-gray-600">
              총 포인트: <span className="font-bold text-blue-600">{data.user.totalPoints.toLocaleString()}P</span>
            </span>
          </div>
          <span className="text-gray-400 hidden sm:inline">•</span>
          <span className="text-gray-600">
            완료한 미션: <span className="font-bold">{data.totalCount}개</span>
          </span>
        </div>
      </div>

      {/* 미션 기록 - 모바일: 카드 형태, 데스크탑: 테이블 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* 데스크탑 테이블 (md 이상) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                    <span>종류</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">T</span>
                    <span>번호</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  미션 내용
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium uppercase tracking-wider">
                  점수
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>날짜 (자동 입력)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logsWithNumber.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    아직 완료한 미션이 없습니다.
                  </td>
                </tr>
              ) : (
                logsWithNumber.map((log) => {
                  const categoryColor = getCategoryColor(log.mission.category);
                  const IconComponent = getIcon(log.mission.icon);

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border}`}
                        >
                          {log.mission.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-lg ${categoryColor.bg} ${categoryColor.text}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.mission.title}
                            </div>
                            <div className="text-xs text-gray-500">{log.mission.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-blue-600">
                          {log.mission.points}P
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{formatDate(log.date)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 형태 (md 미만) */}
        <div className="md:hidden divide-y divide-gray-200">
          {logsWithNumber.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              아직 완료한 미션이 없습니다.
            </div>
          ) : (
            logsWithNumber.map((log) => {
              const categoryColor = getCategoryColor(log.mission.category);
              const IconComponent = getIcon(log.mission.icon);

              return (
                <div key={log.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* 왼쪽 아이콘 영역 */}
                    <div className={`p-2 rounded-lg ${categoryColor.bg} ${categoryColor.text} flex-shrink-0`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    
                    {/* 중앙 컨텐츠 영역 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 font-medium">{log.number}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {log.mission.title}
                      </div>
                    </div>
                    
                    {/* 오른쪽 점수 및 날짜 영역 */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border} mb-1`}
                      >
                        {log.mission.category}
                      </span>
                      <span className="text-sm font-bold text-blue-600 whitespace-nowrap">
                        {log.mission.points}P
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(log.date)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

