# Travel AI Automation Platform 설계

## 1. 전체 디렉토리 구조

```text
/crm            고객 프로필, 상담 이력, 태그, 세그먼트, 리드 상태 관리
/kakao          카카오톡 채널 웹훅, 메시지 정규화, 예약 의도 분석
/wechat         위챗 메시지/미니프로그램 연동 어댑터
/google-sheet   견적표·정산표·운영 시트 동기화
/booking        예약 리드, 확정 예약, 결제/취소 상태 관리
/codex-agent    운영 자동화 에이전트 워크플로우 및 프롬프트
/docker         로컬/운영 배포 구성
/src            초기 실행 가능한 TypeScript 도메인 코드
/docs           아키텍처와 데이터 흐름 문서
```

## 2. 모듈별 기술 스택

| 모듈 | 역할 | 권장 기술 스택 | 외부 연동 |
| --- | --- | --- | --- |
| CRM | 고객 단일 프로필, 상담 이력, 예약 리드 자동 생성 | NestJS 또는 Fastify, PostgreSQL, Prisma, Redis | HubSpot/Salesforce 선택 연동 가능 |
| Kakao | 카카오톡 상담 메시지 수집, 예약 정보 추출 | Kakao i Open Builder/카카오톡 채널 API, Node.js webhook, Zod validation | Kakao Developers REST API, 채널 웹훅 |
| WeChat | 중국 고객 상담/예약 문의 수집 | WeChat Official Account API, Node.js adapter | WeChat message API |
| Google Sheet | 운영팀이 쓰는 견적·정산 시트와 양방향 동기화 | Google Sheets API, 서비스 계정, BullMQ job | Google Workspace |
| Booking | 여행 상품, 일정, 인원, 상태, 결제/취소 관리 | PostgreSQL, event sourcing-lite, REST/GraphQL API | OTA/자체 예약 엔진 |
| Codex Agent | 누락 필드 확인, 상담 요약, 자동 태스크 생성 | LLM orchestration, prompt registry, audit log | CRM/Booking 내부 API |
| Docker | 개발/운영 실행 환경 표준화 | Docker Compose, Postgres, Redis, Node.js | CI/CD, secret manager |

## 3. 우선 구현 범위

MVP는 `카카오톡 메시지 → 예약 의도 분석 → CRM 고객 생성 → Booking 리드 생성 → Google Sheet 동기화` 순서로 구현합니다. 이 경로가 가장 빈번한 예약 문의를 자동화하고 운영자 수작업을 즉시 줄일 수 있습니다.

초기 검증 시나리오는 고정 목적지 규칙이 아니라 투어·상품 카탈로그를 기준으로 실행합니다. 카카오 메시지에 전화번호나 이메일이 없어도 Kakao `userId`를 `channelCustomerId`로 보존해 CRM 고객을 안정적으로 식별하고, Booking 리드는 UUID 기반 `lead_<UUID>` 형식으로 생성합니다.

## 4. 핵심 데이터 모델

- `TourProduct`: 상품 ID, 상품명, 목적지, 별칭, 샘플 메시지.
- `ReservationIntent`: 채널, 채널 고객 ID, 고객명, 연락처, 목적지, 출발일, 종료일, 인원, 상품 ID, 상품명, 원문 메모, 분석 신뢰도.
- `CrmCustomer`: 고객 ID, 이름, 연락처, 유입 채널, 채널 고객 ID, 태그.
- `BookingRecord`: 예약/리드 ID, 고객 ID, 여행지, 일정, 인원, 상태, 상품 ID, 상품명, 메모.

## 5. 상품 카탈로그 운영

`src/catalog/tour-catalog.ts`의 기본 카탈로그는 파서가 인식하는 상품명의 단일 기준입니다. 상품을 추가하면 별칭과 샘플 메시지가 함께 등록되고, 상품을 삭제하면 같은 문구가 들어온 메시지도 더 이상 해당 상품으로 분류되지 않습니다.
