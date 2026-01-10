import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { nickname, password, department } = req.body;

    if (!nickname || !password || !department) {
      return res.status(400).json({ error: '닉네임, 비밀번호, 부서를 모두 입력해주세요.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
    }

    const validDepartments = ['소망부', '사랑부', '믿음부'];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({ error: '유효한 부서를 선택해주세요.' });
    }

    // 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { nickname },
    });

    if (existingUser) {
      return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        nickname,
        password: hashedPassword,
        department,
        totalPoints: 0,
      },
      select: {
        id: true,
        nickname: true,
        department: true,
        totalPoints: true,
      },
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
      return res.status(400).json({ error: '닉네임과 비밀번호를 입력해주세요.' });
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { nickname },
    });

    if (!user) {
      return res.status(401).json({ error: '닉네임 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: '닉네임 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        department: user.department,
        totalPoints: user.totalPoints,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 현재 사용자 정보
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
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

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

export default router;

