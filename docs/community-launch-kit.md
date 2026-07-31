# Community launch kit

Use this copy only after the project page is live and the demo command has been rechecked. The maintainer should submit from their own account and remain available to answer technical questions.

Do not ask for votes, stars, or supportive comments. Ask for specific evaluation feedback.

## Show GN

### 제목

Show GN: 카카오 여행 문의를 PostgreSQL 예약 리드로 바꾸는 TypeScript 오픈소스 예제

### 본문

카카오 여행 상담 메시지를 검증·파싱해 PostgreSQL 고객 기록과 예약 리드로 저장하는 Apache-2.0 예제를 공개했습니다.

현재 구현 범위는 HMAC 웹훅 검증, 256 KiB 본문 제한, Zod 경계 검증, 규칙 기반 예약 정보 추출, 고객 식별자 소유권 충돌 방지, 이벤트 lease·token fencing, 멱등 예약 리드 저장입니다. PostgreSQL 16 기반 마이그레이션·동시성 테스트는 공개 CI에서 실행합니다.

프로젝트 페이지의 브라우저 샌드박스에서 설치 없이 합성 메시지 한 건을 실행할 수 있고, `npm run demo`로 전체 로컬 참조 경로를 확인할 수 있습니다. 실제 CRM·Google Sheets 어댑터는 아직 fake이며, 그 상태에서는 production 시작을 차단합니다.

- 프로젝트 페이지: https://cstion-ai.github.io/cstion/
- 저장소: https://github.com/cstion-ai/cstion
- PostgreSQL 검증 자료: https://github.com/cstion-ai/cstion/blob/main/docs/postgresql-verification.md

피드백을 받고 싶은 부분은 “실제 CRM 어댑터를 붙이기 전에 어떤 경계나 실행 예제가 더 필요했는지”입니다.

## Show HN

### Title

Show HN: A duplicate-safe Kakao-to-PostgreSQL travel lead pipeline

### Text

I built an Apache-2.0 TypeScript reference pipeline that turns signed Kakao travel inquiries into PostgreSQL customer records and booking leads.

The implemented path includes raw-body HMAC verification, a 256 KiB request limit, Zod parsing, deterministic reservation extraction, event leases with token fencing, customer identity ownership checks, and idempotent booking inserts. A public PostgreSQL 16 CI job covers the recorded migration and concurrency scenarios.

You can run one synthetic message without installing anything in the browser
sandbox on the project page. To exercise the full local reference path:

```bash
git clone https://github.com/cstion-ai/cstion.git
cd cstion
npm ci
npm run demo
```

This is a reference implementation, not a hosted service. Real CRM and Google Sheets adapters are still fakes, and production startup stays blocked while that is true.

Project page: https://cstion-ai.github.io/cstion/

I would value concrete feedback on the evaluation path: what boundary, fixture, or adapter example would you need before trying it against a sandbox system?

## Product Hunt

The safe interactive sandbox now exists. Still wait until there is at least one
permissioned independent evaluation report or one real external adapter before
a broad product launch. Developer communities remain the better first channel
for a reference implementation at this stage.

Suggested later tagline:

> A privacy-aware Kakao-to-CRM reference pipeline for travel teams

## Current channel fit

Reviewed on 2026-07-31:

- [Show GN](https://hada.io/blog/geeknews-show/) fits an early open-source release when visitors can inspect or try it and the post asks for specific feedback.
- [Show HN](https://news.ycombinator.com/showhn.html) fits something people can run, but its rules prohibit asking for upvotes or supportive comments.
- [Product Hunt](https://www.producthunt.com/launch) can point directly to a GitHub repository, but a broader launch should wait for independent evaluation evidence or a real external adapter.
- [`awesome-nodejs`](https://github.com/sindresorhus/awesome-nodejs/blob/main/contributing.md) is not eligible: its current contribution rules require at least 30 days and 100 stars and reject boilerplates.
- [`awesome-selfhosted`](https://github.com/awesome-selfhosted/awesome-selfhosted-data/blob/master/CONTRIBUTING.md) is not eligible: its current contribution rules require a substantially older first release and a working end-user application.

Do not submit to an ineligible directory to manufacture a backlink. Recheck the upstream rules when the project’s scope or evidence changes.

## Launch checklist

- Confirm the project page and every link load without authentication.
- Run every browser-sandbox state and verify that no request leaves the page.
- Run `npm ci` and `npm run demo` from a clean checkout.
- Confirm CI, PostgreSQL, CodeQL, and the current release are green.
- State the fake-adapter and production-readiness limits in the launch post.
- Ask for one specific kind of feedback.
- Answer questions and record only permissioned adoption evidence.
- Do not cross-post everywhere at once; learn from one community before revising the next post.
