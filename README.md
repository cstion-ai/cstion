# Travel AI Automation Platform

여행 예약 데이터를 카카오톡, 위챗, Google Sheet, Booking/CRM 시스템과 연결해 자동 분석·관리하는 플랫폼 설계 및 초기 코드입니다.

## 핵심 목표

- 상담 메시지에서 여행 예약 의도를 자동 추출합니다.
- 고객 프로필을 CRM에 자동 생성하거나 갱신합니다.
- 예약 리드를 Booking 모듈에 생성하고 운영 시트로 동기화합니다.
- Codex Agent가 누락 정보 확인, 상담 요약, 후속 태스크 생성을 자동화합니다.

## 디렉토리 구조

- `crm/`: 고객 프로필, 태그, 상담 이력, 리드 상태 관리
- `kakao/`: 카카오톡 채널 메시지 수집, 예약 분석, 카카오 로그인 연동
- `wechat/`: WeChat 메시지 수집 어댑터
- `google-sheet/`: Google Sheets 운영 데이터 동기화
- `booking/`: 예약 리드/확정/취소 상태 관리
- `codex-agent/`: 자동 후속 업무와 운영 에이전트 워크플로우
- `docker/`: 로컬 인프라(PostgreSQL, Redis) 구성
- `cloud/`: Cloud Run/ECS 배포 예시, Secret Manager, 운영 체크리스트
- `src/`: MVP 초기 TypeScript 코드
- `docs/`: 아키텍처 및 데이터 흐름 문서

## MVP 실행

```bash
npm install
npm run typecheck
npm test
npm run dev
npm run dev:server
```

## P0 안전장치

- `ChannelMessage.providerEventId` 기준으로 이벤트 중복 처리를 차단합니다. 운영 구현은 PostgreSQL `UNIQUE (channel, provider_event_id)` 제약을 사용합니다.
- 고객 내부 ID는 UUID로 유지하고 Kakao ID, 전화번호, 이메일은 별도 identity로 연결합니다.
- 날짜, 인원, 상품, 목적지가 없거나 실제 달력 날짜가 아니면 Booking lead를 만들지 않고 `needs_confirmation`을 반환합니다.
- CRM/Google Sheets는 adapter interface와 fake adapter로만 연결해 실제 외부 API 호출을 막습니다.
- 로그 출력 전 이메일, 전화번호, API key, token, secret, password를 마스킹합니다.
- production 환경에서는 필수 secret이 없으면 Zod 환경 검증 단계에서 즉시 실패합니다.

## API 엔드포인트

초기 API 서버는 `src/server.ts`에서 실행하며 다음 MVP 엔드포인트를 제공합니다.

- `GET /health`: 배포/로드밸런서 상태 확인
- `GET /auth/kakao/login`: 카카오 OAuth 인가 URL 생성
- `GET /auth/kakao/callback`: 카카오 인가 코드 토큰 교환
- `POST /webhooks/kakao`: 카카오 메시지 payload를 예약 의도, CRM 고객, Booking 리드로 변환

## 카카오 로그인 연동

`src/kakao/oauth.ts`는 카카오 OAuth 2.0 인가 URL 생성과 인가 코드 토큰 교환을 담당합니다. 운영 환경에서는 `KAKAO_REST_API_KEY`, `KAKAO_REDIRECT_URI`, `KAKAO_CLIENT_SECRET`를 Secret Manager 또는 환경 변수로 주입하고, 콜백에서 받은 프로필을 CRM 고객과 매칭합니다.


## 테스트 보강

`npm test`는 Node.js test runner와 `tsx`를 사용해 카카오 예약 파서, OAuth URL 생성, CRM/Booking 파이프라인을 검증합니다.

## 클라우드 배포 보완

MVP는 컨테이너 이미지로 빌드한 뒤 Cloud Run 또는 ECS/Fargate에 배포하는 구조를 권장합니다. 운영 Secret은 `.env`에 직접 저장하지 않고 각 클라우드의 Secret Manager에 보관하며, 카카오 Redirect URI와 웹훅 URL은 배포된 HTTPS 엔드포인트로 등록합니다. 예시는 `cloud/README.md`, `cloud/gcp-cloud-run-service.yaml`, `cloud/aws-ecs-task-definition.json`에 정리했습니다.

## 배포 금지 조건

다음 조건 중 하나라도 해당하면 병합/배포하지 않습니다.

- GitHub Actions CI 또는 로컬 `npm ci`, `npm test`, `npm run typecheck`, `npm run build` 실패
- PostgreSQL schema migration 미적용 또는 idempotency unique constraint 누락
- production secret 누락, `.env`/로그 내 secret 노출, redaction 테스트 실패
- Kakao webhook/Redirect URI가 HTTPS로 설정되지 않음
- CRM/Google Sheets 실제 adapter가 timeout, retry, error classification 없이 활성화됨

## 설계 문서

- [전체 아키텍처](docs/architecture.md)
- [데이터 흐름도](docs/data-flow.md)
