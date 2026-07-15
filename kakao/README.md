# /kakao 모듈

카카오톡 채널 메시지 수집, 예약 의도 분석, 카카오 로그인 연동을 담당합니다.

## 카카오톡 접속 시 로그인 방식

1. Kakao Developers에서 애플리케이션을 생성하고 REST API 키를 발급합니다.
2. Redirect URI를 예: `https://travel.example.com/auth/kakao/callback` 형식으로 등록합니다.
3. 프론트엔드는 `buildKakaoLoginUrl()`로 카카오 인증 URL을 만들고 사용자를 카카오 로그인 화면으로 이동시킵니다.
4. 카카오는 로그인 성공 후 `code`와 `state`를 Redirect URI로 전달합니다.
5. 백엔드는 `exchangeKakaoAuthorizationCode()`로 인가 코드를 액세스 토큰으로 교환합니다.
6. 토큰으로 사용자 프로필을 조회한 뒤 CRM 고객 식별자와 연결합니다.

초기 구현 코드는 `src/kakao/oauth.ts`와 `src/kakao/reservation-parser.ts`를 기준으로 확장합니다.
