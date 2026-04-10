# $10,000 챌린지 - 설정 가이드

## 🚀 빠른 시작

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) → 새 프로젝트 생성
2. Authentication → Google 로그인 활성화
3. Firestore Database → 프로덕션 모드로 생성
4. 프로젝트 설정 → 웹 앱 추가 → 설정값 복사

### 2. 환경변수 설정

**Frontend:**
```bash
cp frontend/.env.local.example frontend/.env.local
# .env.local 파일에 Firebase 설정값 입력
```

**Backend:**
```bash
cp backend/.env.example backend/.env
# .env 파일에 Firebase Admin SDK 키와 Binance API 키 입력
```

Firebase Admin SDK 키 발급:
- Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성

### 3. Firestore 규칙 배포
```bash
npm install -g firebase-tools
firebase login
firebase use --add  # 프로젝트 선택
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. 설치 및 실행

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

---

## 🔑 바이낸스 API 설정

> **중요**: 읽기 전용(Read-Only) 권한으로만 발급하세요!

1. 바이낸스 로그인 → 계정 → API 관리
2. API 키 생성
3. 권한 설정:
   - ✅ 읽기 허용
   - ❌ 현물 거래 비활성화
   - ❌ 선물 거래 비활성화
   - ❌ 출금 비활성화
4. IP 화이트리스트 설정 (서버 IP 입력)

---

## 📦 프로젝트 구조

```
10000-challenge/
├── backend/                # Node.js + Express 백엔드
│   ├── routes/             # API 라우트
│   │   ├── trades.js       # 매매일지 CRUD
│   │   ├── bankroll.js     # 뱅크롤 관리 + 바이낸스 동기화
│   │   ├── chart.js        # 캔들 차트 데이터
│   │   └── users.js        # 유저 프로필
│   ├── services/
│   │   ├── binanceService.js  # 바이낸스 API 연동
│   │   └── firebaseService.js # Firebase Admin SDK
│   └── server.js           # 서버 진입점 + Cron 자동 업데이트
│
├── frontend/               # React + Vite 프론트엔드
│   └── src/
│       ├── components/
│       │   ├── Dashboard/       # 뱅크롤 대시보드 + 성장 차트
│       │   ├── TradeJournal/    # 매매일지 CRUD
│       │   ├── StrategyFeed/    # 전략 공유 피드
│       │   ├── RiskCalculator/  # 리스크 계산기
│       │   ├── Chart/           # TradingView 캔들 차트
│       │   └── Analytics/       # RoR 시뮬레이터, 켈리 최적화
│       └── utils/
│           ├── kelly.js         # 켈리 공식, 포지션 계산
│           └── ror.js           # 파산 확률 몬테카를로 시뮬레이션
│
├── firestore.rules         # Firestore 보안 규칙
└── firebase.json           # Firebase Hosting 설정
```

## 🎯 주요 기능

| 기능 | 설명 |
|------|------|
| 뱅크롤 대시보드 | 실시간 자산 추이, 챌린지 달성률, 리더보드 |
| 바이낸스 연동 | API로 선물 지갑 잔고 자동 동기화 (10분 Cron) |
| 매매일지 | 거래 기록, 전략 입력, 손익 추적 |
| 전략 피드 | 친구와 매매 전략 실시간 공유 |
| TradingView 차트 | 캔들 차트 + 심볼/인터벌 선택 |
| 리스크 계산기 | 포지션 규모, 손익비, 켈리 비중 자동 계산 |
| RoR 시뮬레이터 | 몬테카를로 파산 확률 시뮬레이션 |
| 켈리 최적화 | 베팅 전략별 기대 자산 성장 비교 |
| 코인별 분석 | 심볼/요일별 승률 및 손익 분포 |
