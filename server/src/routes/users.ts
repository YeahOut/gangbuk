import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 마이페이지 정보 조회 (미션 로그 + 순위)
router.get('/mypage', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // 사용자 기본 정보
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        department: true,
        totalPoints: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 사용자의 미션 로그 조회 (날짜별로 정렬)
    const missionLogs = await prisma.missionLog.findMany({
      where: { userId },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            description: true,
            points: true,
            category: true,
            icon: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // 날짜별로 그룹화
    const logsByDate: Record<string, typeof missionLogs> = {};
    missionLogs.forEach((log) => {
      const dateKey = log.completedAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!logsByDate[dateKey]) {
        logsByDate[dateKey] = [];
      }
      logsByDate[dateKey].push(log);
    });

    // 날짜별 미션 로그를 배열로 변환 (최신순)
    const logsByDateArray = Object.entries(logsByDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, logs]) => ({
        date,
        logs: logs.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()),
      }));

    // 전체 순위 계산
    const allUsers = await prisma.user.findMany({
      select: { id: true, totalPoints: true },
      orderBy: { totalPoints: 'desc' },
    });
    const totalRank = allUsers.findIndex((u) => u.id === userId) + 1;

    // 카테고리별 순위 계산
    const categories = ['말씀', '기도', '교제', '전도'];
    const categoryRanks: Record<string, number> = {};

    for (const category of categories) {
      const missions = await prisma.mission.findMany({
        where: { category },
        select: { id: true, points: true },
      });
      const missionIds = missions.map((m) => m.id);
      const missionPointsMap = new Map(missions.map((m) => [m.id, m.points]));

      const allUsersForCategory = await prisma.user.findMany({
        select: { id: true, nickname: true },
      });

      const rankingPromises = allUsersForCategory.map(async (u) => {
        const completedMissions = await prisma.missionLog.findMany({
          where: {
            userId: u.id,
            missionId: { in: missionIds },
          },
          select: { missionId: true },
        });

        const categoryPoints = completedMissions.reduce(
          (sum, log) => sum + (missionPointsMap.get(log.missionId) || 0),
          0
        );

        return {
          id: u.id,
          points: categoryPoints,
        };
      });

      const ranking = await Promise.all(rankingPromises);
      ranking.sort((a, b) => b.points - a.points);
      const categoryRank = ranking.findIndex((r) => r.id === userId) + 1;
      categoryRanks[category] = categoryRank || allUsersForCategory.length + 1;
    }

    res.json({
      user,
      missionLogs: logsByDateArray,
      totalCount: missionLogs.length,
      ranks: {
        total: totalRank,
        ...categoryRanks,
      },
    });
  } catch (error) {
    console.error('Get mypage error:', error);
    res.status(500).json({ error: '마이페이지 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

export default router;

