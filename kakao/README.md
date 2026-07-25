# Kakao 모듈

카카오 웹훅 입력 검증, 규칙 기반 예약 정보 추출, OAuth 인가 코드 교환을 담당합니다.

## 구현된 로그인 경계

1. Kakao Developers에서 애플리케이션을 생성하고 REST API 키를 발급합니다.
2. Redirect URI를 예: `https://travel.example.com/auth/kakao/callback` 형식으로 등록합니다.
3. `GET /auth/kakao/login`은 무작위 `state`를 HttpOnly·SameSite 쿠키에 저장하고 `buildKakaoLoginUrl()`로 만든 인가 URL을 반환합니다.
4. 클라이언트는 반환된 URL로 사용자를 카카오 로그인 화면에 이동시킵니다.
5. 카카오는 로그인 성공 후 `code`와 `state`를 Redirect URI로 전달합니다.
6. 백엔드는 콜백 `state`를 쿠키 값과 비교하고 응답에서 쿠키를 만료시킨 뒤, `exchangeKakaoAuthorizationCode()`로 인가 코드를 액세스 토큰으로 교환합니다. 토큰 요청 제한시간은 5초입니다.
7. 콜백 응답은 토큰 종류와 만료 시간만 반환하며 access token과 refresh token을 노출하지 않습니다.

현재 로그인 URL은 구현되지 않은 프로필·이메일·전화번호 기능을 위한 추가 동의 `scope`를 요청하지 않습니다. 사용자 프로필 조회, CRM 고객 연결, 원자적인 일회용 OAuth 상태 저장소는 아직 구현되지 않았습니다. 현재 코드와 테스트는 [`src/kakao/oauth.ts`](../src/kakao/oauth.ts), [`src/server/http-server.ts`](../src/server/http-server.ts), [`test/server.test.ts`](../test/server.test.ts)에 있습니다.
