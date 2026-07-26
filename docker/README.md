# /docker 모듈

로컬 개발용 PostgreSQL, Redis, 애플리케이션 컨테이너 구성을 제공합니다.

## 보안 기준

- PostgreSQL 비밀번호는 compose 파일에 고정하지 않고 `POSTGRES_PASSWORD` 환경 변수로만 주입합니다.
- PostgreSQL, Redis, app 포트는 모두 `127.0.0.1`에만 바인딩합니다.
- PostgreSQL 데이터는 `postgres_data` volume에 저장합니다.
- PostgreSQL, Redis, app 모두 healthcheck를 포함합니다.
- 초기 schema는 `src/repositories/postgres-schema.sql`을 mount해 idempotency unique constraint를 포함합니다.
- `migrate` 서비스는 기존 volume에도 기록형 migration을 적용하며, 성공한 뒤에만 app 서비스가 시작됩니다.
