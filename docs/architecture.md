# 아키텍처

이 문서는 현재 구현과 운영 전 계획을 구분합니다. 실제 CRM·Google Sheets·WeChat·모델 경로는 없으며, fake 외부 어댑터가 남아 있는 동안 production 런타임은 시작되지 않습니다.

## 디렉토리와 현재 책임

```text
/crm            고객 upsert 서비스와 외부 CRM 연동의 미구현 범위
/kakao          카카오 웹훅, 규칙 기반 파서, OAuth 경계
/wechat         미구현 WeChat 연동 범위
/google-sheet   Sheets 어댑터 인터페이스와 미구현 범위
/booking        예약 리드 생성과 저장
/codex-agent    Codex 유지보수 원칙; 런타임 에이전트 없음
/docker         로컬 PostgreSQL, Redis, migration, 앱 구성
/cloud          검증 전 Cloud Run/ECS 배포 예시
/evaluation     합성 예약 문의 데이터셋과 오프라인 파서 평가 기준
/src            실행 가능한 TypeScript 코드
/docs           아키텍처, 데이터 흐름, 위협 모델, 로드맵
```

## 구현 상태

| 영역 | 현재 구현 | 남은 범위 |
| --- | --- | --- |
| Kakao | Node HTTP 웹훅, HMAC, Zod, 규칙 기반 파서, OAuth 코드 교환 | 프로필 조회, CRM 연결, 서버측 일회용 OAuth 상태 |
| CRM customer | 고객 식별자 생성, 메모리 저장소, PostgreSQL lock과 소유권 검사 | 실제 CRM 공급자 어댑터 |
| Booking | 필수 필드 검증, stable lead ID, 메모리·PostgreSQL 저장소 | 확정 예약, 재고, 가격, 결제, 취소, 환불 |
| Google Sheets | typed interface와 테스트용 fake | Sheets API, 자격증명, replay-safe 동기화 |
| WeChat | 공통 채널 enum 값 | 웹훅, 인증, payload, 어댑터, 테스트 |
| Codex | 코드 검토와 저장소 유지보수 | 런타임 에이전트 경로 없음 |
| Evaluation | 합성 데이터셋, strict schema, 결정론적 파서 평가 CLI | 더 넓은 언어·표현 범위와 별도 검토된 모델 후보 |
| 배포 | Docker/Cloud 예시와 recorded migration | 실제 공급자·PostgreSQL·클라우드 통합 검증 |

## 운영 전 배포 기준

- API와 migration은 동일한 빌드 산출물을 사용해야 합니다.
- webhook event, customer identity, booking lead는 하나의 관리형 PostgreSQL에 저장해야 합니다.
- 배포 전에 recorded migration과 실제 PostgreSQL 통합 시나리오가 통과해야 합니다.
- 엣지에서 TLS, rate limit, 요청 제한을 적용하고 비밀 저장·회전과 로그 보존 정책을 마련해야 합니다.
- CRM과 Sheets 어댑터는 제한 시간, 취소, typed retry 분류, downstream idempotency, provider-backed 테스트를 통과해야 합니다.

현재 Cloud Run/ECS 파일은 배포 예시이며 위 조건을 통과했다는 증거가 아닙니다.

## 현재 실행 경로

`서명된 Kakao webhook → 입력 검증 → PostgreSQL event lease → 규칙 기반 추출 → customer upsert → Booking lead 저장 → 개발용 fake CRM/Sheets 호출`

실제 CRM과 Google Sheets 호출은 이 경로에 포함되지 않습니다.

## 핵심 데이터 모델

- `ReservationIntent`: 채널, 고객명, 연락처, 목적지, 출발일, 종료일, 인원, 상품명, 원문 메모, 분석 신뢰도.
- `CrmCustomer`: 고객 ID, 이름, 연락처, 유입 채널, 태그.
- `BookingRecord`: 예약/리드 ID, 고객 ID, 여행지, 일정, 인원, 상태, 메모.

## P0 안전장치

- **Ingestion 경계**: Kakao webhook은 256KB 제한을 적용하고 원문 HMAC-SHA256 서명을 확인한 뒤 Zod schema로 파싱합니다. 모든 채널 메시지는 255자 이하의 `ChannelMessage.providerEventId`와 `providerUserId`를 포함해야 합니다.
- **Idempotency**: 운영 서버는 `DATABASE_URL`로 PostgreSQL pipeline을 구성하고 `channel_events`의 `UNIQUE (channel, provider_event_id)` 제약으로 중복 이벤트를 차단합니다. `failed` 이벤트와 5분 넘게 멈춘 processing lease만 새 token으로 재시작하고, lease를 잃은 이전 작업은 상태를 완료로 바꿀 수 없습니다. Booking lead ID 충돌은 기존 레코드를 유지합니다.
- **Customer identity**: 내부 고객 ID는 UUID로 유지하고, channel provider ID, phone, email은 `customer_identities`에서 별도 identity로 연결합니다. 동시 upsert는 정렬된 identity advisory lock을 transaction 범위로 획득한 후 모든 기존 owner를 재조회하며, owner가 둘 이상이면 transaction을 중단합니다.
- **Booking 생성 차단**: 날짜, 인원, 상품, 목적지 필수값이 누락되거나 달력상 불가능한 날짜면 `needs_confirmation`을 반환하고 예약 리드를 만들지 않습니다.
- **외부 연동 격리**: CRM과 Google Sheets는 adapter interface 뒤에 두며 MVP에서는 fake adapter로만 검증합니다.
- **민감정보 보호**: 현재 실패 경로는 redaction utility를 거쳐 이메일, 전화번호, credential·token·secret·password 키의 값을 마스킹합니다. 이름, provider ID, UUID, 임의 원문은 보장 범위가 아닙니다.
- **OAuth 경계**: Kakao 로그인 `state` 원문은 쿠키에 저장하지 않고 서버 비밀키로 만든 HMAC 검증값만 HttpOnly·SameSite 쿠키에 저장합니다. 콜백에서는 상수 시간으로 비교하고 쿠키를 즉시 만료시킵니다. 토큰 교환 요청 제한시간은 5초입니다.
- **Schema upgrade**: `npm run db:migrate:prod`가 advisory lock과 migration 기록 테이블을 사용해 기존 identity와 event 상태를 안전하게 갱신합니다. identity 소유자가 충돌하면 임의 병합하지 않고 중단합니다.
- **Production fail-closed**: CRM과 Google Sheets 실제 adapter가 구현되기 전에는 production 런타임을 시작하지 않습니다.
- **배포 금지 조건**: CI 실패, production secret 누락, PostgreSQL migration 미적용, webhook HTTPS 미설정, redaction 테스트 실패 시 배포하지 않습니다.
