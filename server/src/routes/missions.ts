import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 모든 미션 조회
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const missions = await prisma.mission.findMany({
      orderBy: { id: 'asc' },
    });

    // 오늘 날짜 계산 (UTC 기준)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // 오늘 완료한 미션 ID 목록 가져오기
    const completedMissions = await prisma.missionLog.findMany({
      where: {
        userId: req.userId,
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: { missionId: true },
    });

    const completedMissionIds = new Set(
      completedMissions.map((log) => log.missionId)
    );

    // 각 미션에 완료 여부 추가 (오늘 날짜 기준)
    const missionsWithStatus = missions.map((mission) => ({
      ...mission,
      completed: completedMissionIds.has(mission.id),
    }));

    res.json({ missions: missionsWithStatus });
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({ error: '미션 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 미션 완료/취소 토글 처리
router.post('/:missionId/toggle', authenticate, async (req: AuthRequest, res) => {
  try {
    const { missionId } = req.params;
    const missionIdNum = parseInt(missionId, 10);

    if (isNaN(missionIdNum)) {
      return res.status(400).json({ error: '유효하지 않은 미션 ID입니다.' });
    }

    // 미션 존재 확인
    const mission = await prisma.mission.findUnique({
      where: { id: missionIdNum },
    });

    if (!mission) {
      return res.status(404).json({ error: '미션을 찾을 수 없습니다.' });
    }

    // 오늘 날짜 계산 (UTC 기준)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // 오늘 이미 완료했는지 확인 (날짜별 체크)
    const existingLog = await prisma.missionLog.findFirst({
      where: {
        userId: req.userId,
        missionId: missionIdNum,
        completedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 트랜잭션으로 미션 로그 생성/삭제 및 포인트 업데이트
    const result = await prisma.$transaction(async (tx) => {
      if (existingLog) {
        // 취소: 오늘 완료한 미션 로그 삭제 및 포인트 차감
        await tx.missionLog.delete({
          where: { id: existingLog.id },
        });

        const updatedUser = await tx.user.update({
          where: { id: req.userId },
          data: {
            totalPoints: {
              decrement: mission.points,
            },
          },
          select: {
            id: true,
            nickname: true,
            department: true,
            totalPoints: true,
          },
        });

        return { user: updatedUser, points: -mission.points, completed: false };
      } else {
        // 완료: 미션 로그 생성 및 포인트 추가
        await tx.missionLog.create({
          data: {
            userId: req.userId!,
            missionId: missionIdNum,
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: req.userId },
          data: {
            totalPoints: {
              increment: mission.points,
            },
          },
          select: {
            id: true,
            nickname: true,
            department: true,
            totalPoints: true,
          },
        });

        return { user: updatedUser, points: mission.points, completed: true };
      }
    });

    res.json({
      success: true,
      points: result.points,
      completed: result.completed,
      user: result.user,
    });
  } catch (error) {
    console.error('Toggle mission error:', error);
    res.status(500).json({ error: '미션 처리 중 오류가 발생했습니다.' });
  }
});

// 사용자가 완료한 미션 목록 조회
router.get('/completed', authenticate, async (req: AuthRequest, res) => {
  try {
    const completedMissions = await prisma.missionLog.findMany({
      where: { userId: req.userId },
      include: {
        mission: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    res.json({ completedMissions });
  } catch (error) {
    console.error('Get completed missions error:', error);
    res.status(500).json({ error: '완료한 미션 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

export default router;

