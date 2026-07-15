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
/cloud          Cloud Run/ECS 배포, Secret Manager, 운영 모니터링 구성
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
| Cloud | 운영 배포와 확장성 확보 | Cloud Run 또는 ECS/Fargate, Managed PostgreSQL, Managed Redis, Secret Manager | HTTPS Load Balancer, Container Registry, Monitoring |

## 3. 클라우드 운영 기준

- **런타임**: Node.js API/worker 컨테이너를 Cloud Run 또는 ECS/Fargate에 배포합니다.
- **데이터 계층**: CRM/Booking 데이터는 Managed PostgreSQL, 큐와 중복 방지는 Managed Redis를 사용합니다.
- **보안**: Kakao/WeChat/Google/CRM API 키는 Secret Manager에 저장하고 런타임 환경 변수로 주입합니다.
- **네트워크**: 카카오 로그인 Redirect URI와 웹훅은 HTTPS 엔드포인트만 허용합니다.
- **관측성**: 웹훅 실패율, 예약 분석 신뢰도, 큐 적체량, 토큰 교환 실패를 메트릭으로 수집합니다.

## 4. 우선 구현 범위

MVP는 `카카오톡 메시지 → 예약 의도 분석 → CRM 고객 생성 → Booking 리드 생성 → Google Sheet 동기화` 순서로 구현합니다. 이 경로가 가장 빈번한 예약 문의를 자동화하고 운영자 수작업을 즉시 줄일 수 있습니다.

## 5. 핵심 데이터 모델

- `ReservationIntent`: 채널, 고객명, 연락처, 목적지, 출발일, 종료일, 인원, 상품명, 원문 메모, 분석 신뢰도.
- `CrmCustomer`: 고객 ID, 이름, 연락처, 유입 채널, 태그.
- `BookingRecord`: 예약/리드 ID, 고객 ID, 여행지, 일정, 인원, 상태, 메모.

## 6. P0 안전장치

- **Ingestion 경계**: 모든 채널 메시지는 `ChannelMessage.providerEventId`와 `providerUserId`를 포함해야 하며, 원본 payload는 내부 도메인 모델로 정규화한 뒤 처리합니다.
- **Idempotency**: 운영 환경에서는 `channel_events`의 `UNIQUE (channel, provider_event_id)` 제약으로 중복 이벤트 처리를 차단합니다.
- **Customer identity**: 내부 고객 ID는 UUID로 유지하고, Kakao/WeChat ID, phone, email은 `customer_identities`에서 별도 identity로 연결합니다.
- **Booking 생성 차단**: 날짜, 인원, 상품, 목적지 필수값이 누락되거나 달력상 불가능한 날짜면 `needs_confirmation`을 반환하고 예약 리드를 만들지 않습니다.
- **외부 연동 격리**: CRM과 Google Sheets는 adapter interface 뒤에 두며 MVP에서는 fake adapter로만 검증합니다.
- **민감정보 보호**: 로그는 redaction utility를 거쳐 이메일, 전화번호, API key, token, secret, password를 마스킹합니다.
- **배포 금지 조건**: CI 실패, production secret 누락, PostgreSQL migration 미적용, webhook HTTPS 미설정, redaction 테스트 실패 시 배포하지 않습니다.
