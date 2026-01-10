import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 파일 로드 (server 디렉토리 기준)
dotenv.config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const missions = [
  // 말씀 카테고리 (7개)
  {
    title: '매일 말씀 읽기',
    description: '매일 말씀을 읽어보세요',
    points: 1,
    category: '말씀',
    icon: 'BookOpen'
  },
  {
    title: '매일 아침 부서방에 말씀 업로드',
    description: '매일 아침 부서방에 말씀을 업로드하세요',
    points: 1,
    category: '말씀',
    icon: 'Upload'
  },
  {
    title: '전도 관련 말씀 듣기',
    description: '전도 관련 말씀(조각말씀 포함)을 들어보세요',
    points: 1,
    category: '말씀',
    icon: 'Headphones'
  },
  {
    title: '교회 설교시간에 노트필기하기',
    description: '설교시간에 노트를 필기하세요',
    points: 1,
    category: '말씀',
    icon: 'PenTool'
  },
  {
    title: '특별집회 참석',
    description: '특별집회에 참석하세요 (총 3일차 각 1점)',
    points: 1,
    category: '말씀',
    icon: 'Calendar'
  },
  {
    title: '주 1회 성구암송 외우기',
    description: '주 1회 성구암송을 외워보세요',
    points: 1,
    category: '말씀',
    icon: 'BookMarked'
  },
  {
    title: '수요말씀 참석하기',
    description: '수요말씀에 참석하세요',
    points: 1,
    category: '말씀',
    icon: 'Church'
  },
  
  // 기도 카테고리 (3개)
  {
    title: '수양회 관련 기도부탁 올리기',
    description: '수양회 관련 기도부탁을 올려주세요',
    points: 1,
    category: '기도',
    icon: 'HeartHandshake'
  },
  {
    title: '기상 후, 취침 전 기도',
    description: '기상 후, 취침 전에 기도하세요',
    points: 1,
    category: '기도',
    icon: 'Sunrise'
  },
  {
    title: '각종 중보기도 및 전도 기도',
    description: '기도부탁 명단, 전도하시는 형제/자매님, 교제에서 멀어진 형제/자매님, 전도인, 자신의 입술과 전도의 문이 열리길 기도 (통합)',
    points: 2,
    category: '기도',
    icon: 'Heart'
  },
  
  // 교제 카테고리 (7개)
  {
    title: '토요교제 참석하기',
    description: '토요교제에 참석하세요',
    points: 1,
    category: '교제',
    icon: 'Users'
  },
  {
    title: '교제 전 형제, 자매와 만나서 함께 교제 참석하기',
    description: '교제 전에 형제, 자매와 만나서 함께 교제에 참석하세요',
    points: 1,
    category: '교제',
    icon: 'Handshake'
  },
  {
    title: '안나오는 형제, 자매에게 연락하기',
    description: '안나오는 형제, 자매에게 연락하세요',
    points: 1,
    category: '교제',
    icon: 'Phone'
  },
  {
    title: '형제, 자매에게 선물주기',
    description: '형제, 자매에게 선물을 주세요',
    points: 2,
    category: '교제',
    icon: 'Gift'
  },
  {
    title: '형제, 자매와 교제하기',
    description: '형제, 자매와 교제하세요',
    points: 2,
    category: '교제',
    icon: 'MessageCircle'
  },
  {
    title: '교제 소식 밴드에 올리기',
    description: '교제 소식을 밴드에 올려주세요',
    points: 1,
    category: '교제',
    icon: 'MessageSquare'
  },
  {
    title: '부서 활동 및 식당 봉사에 참여하기',
    description: '부서 활동 및 식당 봉사에 참여하세요',
    points: 2,
    category: '교제',
    icon: 'UtensilsCrossed'
  },
  
  // 전도 카테고리 (7개)
  {
    title: '전도대상자에게 선물주기',
    description: '전도대상자에게 선물을 주세요',
    points: 3,
    category: '전도',
    icon: 'Gift'
  },
  {
    title: '전도대상자에게 바이블래터 전해주기',
    description: '전도대상자에게 바이블래터를 전해주세요',
    points: 2,
    category: '전도',
    icon: 'Book'
  },
  {
    title: '전도대상자에게 안부 묻기',
    description: '전도대상자에게 안부를 물어보세요',
    points: 2,
    category: '전도',
    icon: 'Phone'
  },
  {
    title: '전도대상자와 만남 약속 잡기',
    description: '전도대상자와 만남 약속을 잡으세요',
    points: 3,
    category: '전도',
    icon: 'Calendar'
  },
  {
    title: '전도대상자와 함께 식사하기',
    description: '전도대상자와 함께 식사하세요',
    points: 5,
    category: '전도',
    icon: 'Utensils'
  },
  {
    title: '수양회 참석 권유하기',
    description: '전도대상자에게 수양회 참석을 권유하세요',
    points: 10,
    category: '전도',
    icon: 'UserPlus'
  },
  {
    title: '수양회 참석 확답받기',
    description: '전도대상자로부터 수양회 참석 확답을 받으세요',
    points: 50,
    category: '전도',
    icon: 'CheckCircle2'
  }
];

async function main() {
  console.log('🌱 Seeding database...');

  // 기존 미션 삭제 후 재생성
  await prisma.mission.deleteMany();
  
  for (const mission of missions) {
    await prisma.mission.create({
      data: mission,
    });
  }

  console.log(`✅ Created ${missions.length} missions`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
