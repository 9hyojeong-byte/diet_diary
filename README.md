# 쿠쿠 식단 기록 (Cuckoo Diet Log) - Technical Specification

본 앱은 개인의 식단 관리 및 활동량을 체계적으로 기록하고, AI를 통해 영양 조언을 받을 수 있는 Full-Stack 웹 어플리케이션입니다.

## 🚀 프로젝트 개요
- **목적**: 간편한 식단 및 활동량 기록, AI 기반 개인 맞춤형 피드백 제공.
- **주요 타겟**: 체중 관리 및 식습관 개선을 목표로 하는 사용자.

## 🛠 기술 스택 (Technical Stack)

### 1. Frontend
- **Framework**: `React 19` (Functional Components, Hooks)
- **Language**: `TypeScript` (Strict Type Safety)
- **Bundler**: `Vite`
- **Styling**: `Tailwind CSS 4.0` (Native CSS-in-JS utility blocks)
- **UI Interaction**: Framer Motion (`motion/react`)
- **PWA**: Service Worker 및 Manifest 설정을 통한 모바일 웹 앱 지원

### 2. Backend & Database
- **Serverless Backend**: `Google Apps Script (GAS)`
- **Database**: `Google Sheets` (Spreadsheet DB)
- **Communication**: REST API (doGet, doPost hooks)를 통한 비동기 데이터 통신.

### 3. Artificial Intelligence
- **AI Engine**: `Google Gemini 1.5 Flash` (via `@google/generative-ai`)
- **Intelligence Focus**: 
  - 식단 기록과 활동 데이터를 분석하여 총평, 활동량 평가, 식단 평가, 맞춤 응원 메시지 생성.
  - TDEE(총 에너지 소비량) 기반의 정밀 조언 제공.

## 📋 핵심 기능 (Core Features)

### 🍴 식단 기록 및 관리
- **끼니별 기록**: 아침, 점심, 간식, 저녁 구분 기록.
- **계획 vs 실제**: 식단 계획(PLANNED)과 실제 섭취(ACTUAL) 상태 관리.
- **영양 성분 자동 계산**: 즐겨찾기(Bookmark) 기반 식재료 DB를 연동하여 탄/단/지/당/식이섬유 등 자동 요약.
- **목표 설정**: 일일 목표 칼로리 및 영양성분 설정 기능 (어제의 목표치를 오늘의 초기값으로 자동 승계).
- **매크로 자동 계산기**: 목표 칼로리 설정 시 탄:단:지 비율(4:3:3 등 커스텀 가능, 현재 단백질 120g 고정/나머지 7:3 비율 계산 로직 탑재)에 따른 자동 배분 기능.

### 🏃 활동 및 일기
- **활동 로그**: 걸음 수, 활동 칼로리, 총 소모 칼로리 기록 및 사진 업로드 지원.
- **건강 일기**: 텍스트 기반 일일 컨디션 및 일기 기록 (UUID 기반 업데이트).
- **메모 시스템**: 간단한 텍스트 메모 기록 (무한 스크롤 및 최신순 정렬).

### 🤖 AI 영양 추천 (AI Nutrition Advice)
- 사용자의 일일 섭취량 및 활동량을 기반으로 Gemini AI가 분석 리포트 생성.
- 섹션 구성: `[총평]`, `[활동량 평가]`, `[식단 평가]`, `[누나를 위한 응원과 추천]`.
- 중복 요청 방지 로직(Ref/Refetch guard) 및 데이터베이스 동기화.

## 💾 데이터 아키텍처 (Data Architecture)

| 시트 이름 | 설명 | 주요 필드 |
| :--- | :--- | :--- |
| `meals` | 식단 기록 | uuid, date, type, status, kcal, Macros... |
| `ingredients` | 식재료 DB | uuid, name, base_amount, kcal, is_bookmarked... |
| `diaries` | 건강 일기 | uuid, date, content, updated_at |
| `activity_logs` | 활동 로그 | uuid, date, steps, calories, image_url... |
| `AI_Recommendations` | AI 조언 내역 | date, advice, created_at |
| `nutrient_targets` | 일일 영양 목표 | date, kcal, carbs, protein, fat |
| `memos` | 메모 | id, content, createdat |

## ⚙️ 주요 기술적 강조 사항
- **KST 전용 날짜 처리**: 한국 표준시(UTC+9)를 기준으로 하는 정밀한 날짜/시간 동기화.
- **토스트 알림 시스템**: 작업 결과(저장, 수정, 복사)를 사용자에게 즉각적으로 알리는 UI/UX.
- **비밀 관리 링크**: 특정 UI 요소 다회 클릭을 통한 관리자 스프레드시트 접근 제어 로직.
- **네트워크 최적화**: GAS의 딜레이를 고려한 로컬 상태(Optimistic UI) 및 로딩 처리.

---
*Developed with Google AI Studio & Gemini API*
