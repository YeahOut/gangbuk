# gangbuk - 교회 청년회 미션 포인트 웹 서비스

미션 사이트

## 기술 스택
- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Backend**: Node.js (Express), TypeScript
- **Database**: SQLite (Prisma ORM)

## 프로젝트 구조
```
church/
├── server/          # 백엔드 서버
├── client/          # 프론트엔드 클라이언트
└── package.json     # 루트 패키지 설정
```

## 시작하기

### 1. 의존성 설치
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. 데이터베이스 설정
```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. 개발 서버 실행
```bash
# 루트에서 실행 (서버 + 클라이언트 동시 실행)
npm run dev

# 또는 각각 실행
npm run dev:server  # 서버만
npm run dev:client  # 클라이언트만
```

## 환경 변수
서버 폴더에 `.env` 파일을 생성하고 다음을 추가하세요:
```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-here"
```

## 주요 기능
- 사용자 인증 (JWT 기반)
- 미션 시스템 (말씀, 기도, 교제, 전도 카테고리)
- 랭킹 시스템 (전체, 부서별, 카테고리별)
- 마이페이지 (날짜별 미션 기록, 순위 조회)
- 24개 미션 seed 데이터
