# Travel AI Automation Platform

여행 예약 데이터를 카카오톡, 위챗, Google Sheet, Booking/CRM 시스템과 연결해 자동 분석·관리하는 플랫폼 설계 및 초기 코드입니다.

## 핵심 목표

- 상담 메시지에서 여행 예약 의도를 자동 추출합니다.
- 고객 프로필을 CRM에 자동 생성하거나 갱신합니다.
- 예약 리드를 Booking 모듈에 생성하고 운영 시트로 동기화합니다.
- Codex Agent가 누락 정보 확인, 상담 요약, 후속 태스크 생성을 자동화합니다.

## 디렉토리 구조

- `crm/`: 고객 프로필, 태그, 상담 이력, 리드 상태 관리
- `kakao/`: 카카오톡 채널 메시지 수집 및 예약 분석
- `wechat/`: WeChat 메시지 수집 어댑터
- `google-sheet/`: Google Sheets 운영 데이터 동기화
- `booking/`: 예약 리드/확정/취소 상태 관리
- `codex-agent/`: 자동 후속 업무와 운영 에이전트 워크플로우
- `docker/`: 로컬 인프라(PostgreSQL, Redis) 구성
- `src/`: MVP 초기 TypeScript 코드
- `docs/`: 아키텍처 및 데이터 흐름 문서

## MVP 실행

```bash
npm install
npm run typecheck
npm run dev
```

## 설계 문서

- [전체 아키텍처](docs/architecture.md)
- [데이터 흐름도](docs/data-flow.md)
