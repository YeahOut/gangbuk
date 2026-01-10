import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 전체 랭킹 조회
router.get('/total', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        department: true,
        totalPoints: true,
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    res.json({ ranking: users });
  } catch (error) {
    console.error('Get total ranking error:', error);
    res.status(500).json({ error: '랭킹을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 카테고리별 랭킹 조회
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const validCategories = ['말씀', '기도', '교제', '전도'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
    }

    // 해당 카테고리의 미션 ID들 가져오기
    const missions = await prisma.mission.findMany({
      where: { category },
      select: { id: true },
    });
    const missionIds = missions.map((m) => m.id);

    // 각 유저별로 해당 카테고리의 미션 포인트 합계 계산
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        department: true,
      },
    });

    const rankingPromises = users.map(async (user) => {
      const completedMissions = await prisma.missionLog.findMany({
        where: {
          userId: user.id,
          missionId: { in: missionIds },
        },
        include: {
          mission: {
            select: { points: true },
          },
        },
      });

      const categoryPoints = completedMissions.reduce(
        (sum, log) => sum + log.mission.points,
        0
      );

      return {
        ...user,
        points: categoryPoints,
      };
    });

    const ranking = await Promise.all(rankingPromises);
    ranking.sort((a, b) => b.points - a.points);

    res.json({ ranking, category });
  } catch (error) {
    console.error('Get category ranking error:', error);
    res.status(500).json({ error: '카테고리별 랭킹을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 부서별 랭킹 조회
router.get('/department', async (req, res) => {
  try {
    const departments = ['소망부', '사랑부', '믿음부'];
    
    const departmentRanking = await Promise.all(
      departments.map(async (department) => {
        const users = await prisma.user.findMany({
          where: { department },
          select: { totalPoints: true },
        });

        const totalPoints = users.reduce((sum, user) => sum + user.totalPoints, 0);

        return {
          department,
          points: totalPoints,
          userCount: users.length,
        };
      })
    );

    departmentRanking.sort((a, b) => b.points - a.points);

    res.json({ ranking: departmentRanking });
  } catch (error) {
    console.error('Get department ranking error:', error);
    res.status(500).json({ error: '부서별 랭킹을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 모든 랭킹 한번에 조회 (프론트엔드 최적화)
router.get('/all', async (req, res) => {
  try {
    // 전체 랭킹
    const totalRankingUsers = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        department: true,
        totalPoints: true,
      },
      orderBy: { totalPoints: 'desc' },
    });
    
    const totalRanking = totalRankingUsers.map(user => ({
      id: user.id,
      nickname: user.nickname,
      department: user.department,
      points: user.totalPoints,
    }));

    // 부서별 랭킹
    const departments = ['소망부', '사랑부', '믿음부'];
    const departmentRanking = await Promise.all(
      departments.map(async (department) => {
        const users = await prisma.user.findMany({
          where: { department },
          select: { totalPoints: true },
        });
        const totalPoints = users.reduce((sum, user) => sum + user.totalPoints, 0);
        return {
          department,
          points: totalPoints,
          userCount: users.length,
        };
      })
    );
    departmentRanking.sort((a, b) => b.points - a.points);

    // 카테고리별 랭킹
    const categories = ['말씀', '기도', '교제', '전도'];
    const categoryRankings: Record<string, any[]> = {};

    for (const category of categories) {
      const missions = await prisma.mission.findMany({
        where: { category },
        select: { id: true, points: true },
      });
      const missionIds = missions.map((m) => m.id);
      const missionPointsMap = new Map(missions.map((m) => [m.id, m.points]));

      const users = await prisma.user.findMany({
        select: { id: true, nickname: true, department: true },
      });

      const rankingPromises = users.map(async (user) => {
        const completedMissions = await prisma.missionLog.findMany({
          where: {
            userId: user.id,
            missionId: { in: missionIds },
          },
          select: { missionId: true },
        });

        const categoryPoints = completedMissions.reduce(
          (sum, log) => sum + (missionPointsMap.get(log.missionId) || 0),
          0
        );

        return {
          id: user.id,
          nickname: user.nickname,
          department: user.department,
          points: categoryPoints,
        };
      });

      const ranking = await Promise.all(rankingPromises);
      ranking.sort((a, b) => b.points - a.points);
      categoryRankings[category] = ranking;
    }

    res.json({
      total: totalRanking,
      department: departmentRanking,
      categories: categoryRankings,
    });
  } catch (error) {
    console.error('Get all rankings error:', error);
    res.status(500).json({ error: '랭킹을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 기존 랭킹 (하위 호환성)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        department: true,
        totalPoints: true,
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    res.json({ ranking: users });
  } catch (error) {
    console.error('Get ranking error:', error);
    res.status(500).json({ error: '랭킹을 가져오는 중 오류가 발생했습니다.' });
  }
});

export default router;
