# /cloud 모듈

Travel AI Automation Platform을 클라우드에 배포하기 위한 운영 보완안입니다. 아래 파일은 배포 구성 초안이며, 현재 CRM과 Google Sheets 실제 adapter가 구현되지 않아 production 런타임은 의도적으로 시작되지 않습니다.

## 계획된 클라우드 아키텍처

```text
Users/Kakao
  -> HTTPS Load Balancer / API Gateway
  -> App Container (Node.js API + pipeline workers)
  -> Managed PostgreSQL (CRM, Booking data)
  -> Managed Redis (queue, rate limit)
  -> Secret Manager (Kakao, WeChat, Google API keys)
  -> Object Storage (exports, logs, attachments)
  -> Monitoring + Alerting (error rate, webhook latency, queue depth)
```

## 배포 단계

0. CRM과 Google Sheets 실제 adapter를 구현하고 timeout, retry, idempotency, 오류 분류 테스트를 통과시킵니다.
1. `npm run build`로 TypeScript를 컴파일합니다.
2. 컨테이너 이미지를 빌드하고 Container Registry에 push한 뒤 immutable digest를 기록합니다.
3. `KAKAO_REST_API_KEY`, `KAKAO_REDIRECT_URI`, `KAKAO_CLIENT_SECRET`, `KAKAO_WEBHOOK_SECRET`, `CRM_API_KEY`, `GOOGLE_SHEET_ID`, `DATABASE_URL`을 Secret Manager에 저장합니다.
4. 동일한 이미지로 일회성 migration job/task를 실행해 `npm run db:migrate:prod`를 완료합니다.
5. Cloud Run 또는 ECS/Fargate 같은 서버리스 컨테이너 런타임에 배포합니다.
6. 카카오 Redirect URI와 채널 웹훅 URL을 클라우드 HTTPS 엔드포인트로 갱신합니다.
7. queue worker, webhook health check, alert policy를 순서대로 활성화합니다.

운영 컨테이너는 `DATABASE_URL`이 없거나 실제 CRM/Sheets adapter가 준비되지 않으면 시작 단계에서 실패합니다. webhook 처리에 사용하는 idempotency, customer, booking 저장소는 모두 같은 관리형 PostgreSQL을 사용해야 하며, 애플리케이션 배포 전에 migration job이 성공해야 합니다. 메모리 저장소와 fake 외부 adapter는 로컬 개발과 테스트에서만 허용합니다.

두 클라우드 예시의 `REPLACE_WITH_REVIEWED_IMAGE_DIGEST`는 실제로 빌드하고 검토한 이미지 digest로 교체해야 합니다. `latest` 같은 mutable tag로 배포하지 않습니다. 위 구성의 worker, Redis queue, rate limit, Secret Manager, 모니터링 경로는 목표 아키텍처이며 현재 저장소에서 통합 검증되지 않았습니다.

## 포함 파일

- `gcp-cloud-run-service.yaml`: Google Cloud Run 배포 예시.
- `aws-ecs-task-definition.json`: AWS ECS/Fargate 태스크 정의 예시.
