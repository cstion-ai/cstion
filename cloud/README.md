# /cloud 모듈

Travel AI Automation Platform을 클라우드에 배포하기 위한 운영 보완안입니다. MVP는 컨테이너 기반으로 빌드하고, 관리형 데이터베이스/캐시/Secret Manager를 연결하는 구조를 권장합니다.

## 권장 클라우드 아키텍처

```text
Users/Kakao/WeChat
  -> HTTPS Load Balancer / API Gateway
  -> App Container (Node.js API + pipeline workers)
  -> Managed PostgreSQL (CRM, Booking data)
  -> Managed Redis (queue, webhook dedupe, rate limit)
  -> Secret Manager (Kakao, WeChat, Google API keys)
  -> Object Storage (exports, logs, attachments)
  -> Monitoring + Alerting (error rate, webhook latency, queue depth)
```

## 배포 단계

1. `npm run build`로 TypeScript를 컴파일합니다.
2. 컨테이너 이미지를 빌드하고 Container Registry에 push합니다.
3. `KAKAO_REST_API_KEY`, `KAKAO_REDIRECT_URI`, `KAKAO_CLIENT_SECRET`, `CRM_API_KEY`, `GOOGLE_SHEET_ID`를 Secret Manager에 저장합니다.
4. Cloud Run 또는 ECS/Fargate 같은 서버리스 컨테이너 런타임에 배포합니다.
5. 카카오 Redirect URI와 채널 웹훅 URL을 클라우드 HTTPS 엔드포인트로 갱신합니다.
6. DB migration, queue worker, webhook health check, alert policy를 순서대로 활성화합니다.

## 포함 파일

- `gcp-cloud-run-service.yaml`: Google Cloud Run 배포 예시.
- `aws-ecs-task-definition.json`: AWS ECS/Fargate 태스크 정의 예시.
