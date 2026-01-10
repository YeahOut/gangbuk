import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Mission {
  id: number;
  title: string;
  description: string;
  points: number;
  category: string;
  icon: string | null;
  completed: boolean;
}

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showPointsAnimation, setShowPointsAnimation] = useState<{
    id: number;
    points: number;
  } | null>(null);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await axios.get('/api/missions');
      setMissions(response.data.missions);
    } catch (error) {
      console.error('Failed to fetch missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (missionId: number) => {
    if (togglingId) return;

    setTogglingId(missionId);
    try {
      const response = await axios.post(`/api/missions/${missionId}/toggle`);
      const { points, completed, user: updatedUser } = response.data;

      // 포인트 애니메이션 표시
      if (points !== 0) {
        setShowPointsAnimation({ id: missionId, points });
        setTimeout(() => setShowPointsAnimation(null), 2000);
      }

      // 미션 상태 업데이트
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, completed } : m))
      );

      // 사용자 정보 업데이트
      updateUser(updatedUser);
    } catch (error: any) {
      alert(error.response?.data?.error || '미션 처리 중 오류가 발생했습니다.');
    } finally {
      setTogglingId(null);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600">로딩 중...</div>
      </div>
    );
  }

  // 카테고리별로 그룹화
  const missionsByCategory = missions.reduce((acc, mission) => {
    if (!acc[mission.category]) {
      acc[mission.category] = [];
    }
    acc[mission.category].push(mission);
    return acc;
  }, {} as Record<string, Mission[]>);

  const categoryOrder = ['말씀', '기도', '교제', '전도'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">미션 목록</h1>
        <p className="text-gray-600">미션을 완료하고 포인트를 획득하세요!</p>
      </div>

      <div className="space-y-8">
        {categoryOrder.map((category) => {
          const categoryMissions = missionsByCategory[category] || [];
          if (categoryMissions.length === 0) return null;

          const categoryColor = getCategoryColor(category);

          return (
            <div key={category}>
              <div
                className={`mb-4 px-4 py-2 rounded-lg ${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border}`}
              >
                <h2 className="text-xl font-bold">{category}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryMissions.map((mission) => {
                  const IconComponent = getIcon(mission.icon);
                  const isToggling = togglingId === mission.id;

                  return (
                    <div
                      key={mission.id}
                      className={`bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg relative overflow-hidden ${
                        mission.completed ? 'ring-2 ring-green-500' : ''
                      }`}
                    >
                      {showPointsAnimation?.id === mission.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-20 z-10 animate-ping">
                          <div
                            className={`${
                              showPointsAnimation.points > 0 ? 'bg-blue-600' : 'bg-red-600'
                            } text-white px-4 py-2 rounded-lg font-bold text-xl`}
                          >
                            {showPointsAnimation.points > 0 ? '+' : ''}
                            {showPointsAnimation.points}P
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-3 rounded-lg ${categoryColor.bg} ${categoryColor.text}`}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border}`}
                        >
                          {mission.category}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {mission.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">{mission.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-5 w-5 text-yellow-500" />
                          <span className="font-bold text-blue-600">{mission.points}P</span>
                        </div>
                        <button
                          onClick={() => handleToggle(mission.id)}
                          disabled={isToggling}
                          className={`px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                            mission.completed
                              ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                          }`}
                        >
                          {isToggling ? (
                            <>
                              <Circle className="h-4 w-4 animate-spin" />
                              <span>처리 중...</span>
                            </>
                          ) : mission.completed ? (
                            <>
                              <X className="h-4 w-4" />
                              <span>취소하기</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>완료하기</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
