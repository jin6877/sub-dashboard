# 구독다 📊

> 넷플릭스·유튜브·멜론·ChatGPT… 흩어진 구독을 한곳에. **"다 합치니 1년에 OO만원?!"** 충격을 주는 구독 관리 대시보드.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-violet)

## 🔗 라이브 데모

**👉 https://sub-dashboard-phi.vercel.app**

![앱 스크린샷](docs/screenshot.png)

## ✨ 주요 기능

- 📝 **구독 추가 / 수정 / 삭제** — 서비스명, 금액, 통화, 결제 주기(주·월·연), 다음 결제일, 카테고리, 메모
- 💱 **실시간 환율 환산 (핵심)** — USD·EUR·JPY·GBP 구독을 실시간 환율로 원화 환산해 총액에 합산
  - `open.er-api.com` 우선 호출 → 실패 시 `frankfurter.app` → 둘 다 실패 시 하드코딩 기본 환율로 폴백
  - 받은 환율은 timestamp와 함께 IndexedDB에 **8시간 캐시**, 오프라인이면 캐시·기본값 사용 (서비스워커도 환율 API를 network-first로 캐시)
  - 화면에 적용 환율(`$1 = ₩1,5xx`)과 출처·갱신 시각 표시, **새로고침 버튼** 제공
- 📊 **대시보드 요약** — 이번 달 총액(원화 환산), 연 환산 금액, 구독 개수, **다음 결제 예정(D-day)**, 가장 비싼 구독
- 📋 **구독 목록 테이블** — 전체 구독을 표로 정리(서비스+카테고리, 월 환산 금액·외화 원금액 병기 `$20 → ₩30,872`, 결제 주기, 다음 결제일+D-day, 수정/삭제). 결제일순·금액순 정렬, 행 hover 강조, 좁은 화면은 가로 스크롤 반응형
- 🍩 **시각화** — 카테고리별 지출 비중 도넛 차트(자체 SVG 구현, 호버 인터랙션) + 다가오는 결제 타임라인
- 😮 **재미 요소** — "1년이면 치킨 OO개 값" 위트 환산
- 🎨 **미니멀 디자인** — 화이트·뉴트럴 그레이 베이스 + 절제된 단일 포인트 컬러. 그라데이션·과한 글로우 없이 차분하고 정돈된 대시보드 톤(노션·리니어 스타일)
- 🗄 **튼튼한 로컬 저장 (IndexedDB)** — 구독 데이터·환율 캐시를 IndexedDB에 저장(`idb-keyval`). 기존 localStorage 데이터는 첫 로드 시 자동 마이그레이션되어 유실 없음. 모든 데이터는 브라우저에만 저장, 서버 전송 없음
- 🔒 **영구 저장 요청** — 앱 시작 시 `navigator.storage.persist()`로 영구 저장을 요청해 저장공간 부족 시 브라우저의 **자동 삭제를 방지**. 푸터에 영구 저장 상태(켜짐/꺼짐) 표시
- 📲 **PWA — 설치형 + 오프라인** — 홈 화면에 설치 가능하고, 서비스워커가 앱 셸을 캐시해 **오프라인에서도 열리고 저장된 구독이 보임**. manifest(한국어, standalone, 192/512 + maskable 아이콘) 포함
- 📱 **모바일 우선 반응형** — 작은 화면에선 하단 FAB·바텀시트 폼

## 🛠 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 | Vite |
| 스타일 | Tailwind CSS v4 |
| 차트 | 자체 구현 SVG 도넛 (라이브러리 없음) |
| 환율 | open.er-api.com / frankfurter.app (무료·키 불필요) |
| 저장 | IndexedDB (`idb-keyval`) + Storage 영구 저장 요청 |
| PWA | vite-plugin-pwa (설치형 · 오프라인 · 서비스워커) |

## 🚀 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기 (http://localhost:4173)
```

## 🔒 데이터 안전성 (자동 삭제 방지)

- **IndexedDB 저장** — 구독·환율 캐시는 IndexedDB에 보관됩니다. 기존 localStorage 사용자는 첫 실행 시 자동으로 한 번 이전되어 데이터가 사라지지 않습니다.
- **영구 저장(persistent storage)** — 앱 시작 시 `navigator.storage.persist()`를 호출해 영구 저장 권한을 요청합니다. 허용되면 저장공간이 부족해도 브라우저가 데이터를 임의로 비우지 않습니다. 현재 상태는 푸터에 표시됩니다.
- **더 안전하게 보관하려면 설치** — 영구 저장이 꺼져 있다면 PWA로 설치하세요. 설치된 앱은 대부분의 브라우저에서 자동으로 영구 저장이 부여됩니다.

## 📲 PWA 설치 방법

- **데스크톱(Chrome/Edge)** — 주소창 오른쪽의 설치 아이콘(⊕) 클릭 → "설치".
- **Android(Chrome)** — 메뉴(⋮) → "앱 설치" / "홈 화면에 추가".
- **iOS(Safari)** — 공유 버튼 → "홈 화면에 추가".
- 설치 후에는 오프라인에서도 앱이 열리고, 마지막으로 저장된 구독과 환율이 그대로 보입니다.

## 🎨 디자인

화이트·뉴트럴 그레이 베이스에 절제된 단일 포인트 컬러를 더한 미니멀 대시보드 톤(노션·리니어 스타일). 카드형 요약·테이블형 목록·단색 도넛 차트가 시각적 중심입니다.

## 📄 라이선스

MIT
