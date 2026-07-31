export const RESERVATION_CHALLENGE_TEST_DATA = {
  schemaVersion: 2,
  kind: "challenge",
  name: "synthetic-korean-reservation-challenge",
  createdAt: "2026-07-31",
  languages: ["ko"],
  domain: "travel-reservation-inquiry",
  labelPolicy: "reservation-fields-v1",
  provenance: {
    source: "synthetic",
    containsPersonalData: false,
    description: "Hand-authored Korean challenge cases without customer data."
  },
  cases: [
    {
      id: "complete-osaka",
      category: "complete",
      language: "ko",
      features: ["korean-date"],
      input: {
        providerEventId: "challenge-event-1",
        providerUserId: "challenge-user-1",
        text: "2026년 9월 3일 오사카 패키지 2명 예약",
        receivedAt: "2026-07-31T00:00:00.000Z"
      },
      expected: {
        fields: {
          destination: "오사카",
          startDate: "2026-09-03",
          travelers: 2,
          productName: "패키지"
        },
        route: "created",
        confirmationFields: []
      }
    },
    {
      id: "missing-travelers",
      category: "missing-field",
      language: "ko",
      input: {
        providerEventId: "challenge-event-2",
        providerUserId: "challenge-user-2",
        text: "2026년 10월 11일 제주 호텔 예약 문의",
        receivedAt: "2026-07-31T00:00:00.000Z"
      },
      expected: {
        fields: {
          destination: "제주",
          startDate: "2026-10-11",
          travelers: null,
          productName: "호텔"
        },
        route: "needs_confirmation",
        confirmationFields: ["travelers"]
      }
    }
  ]
};
