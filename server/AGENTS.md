# server/AGENTS.md

## Module Context

Bun 런타임에서 동작하는 AI API 프록시. 브라우저의 `/api/*` 요청을 받아 Anthropic 또는 Gemini를 호출하고, 응답을 react-live 실행 가능한 코드로 정규화해 돌려준다.

## Tech Stack & Constraints

- HTTP 서버는 `Bun.serve`, 외부 호출은 전역 `fetch`만 쓴다. 공급자 SDK나 axios를 추가하지 않는다(`server/index.ts:69,101`).
- 모든 응답에 `CORS_HEADERS`를 붙인다(`server/index.ts:51-55`, 모든 `Response.json` 호출).
- 사용자에게 보이는 에러 메시지는 한국어로 쓴다(`server/index.ts:124,196,203`).

## Implementation Patterns

- 순수 로직은 별도 파일로 분리하고 `index.ts`는 라우팅과 외부 호출만 담당한다. 예: 응답 정규화 `generator.ts`, 모델 폴백 `fallback.ts`.
- Gemini 모델 우선순위는 `GOOGLE_MODELS` 배열 순서로 정한다(`server/index.ts:5`). 모델 교체는 이 배열만 수정한다.
- 새 엔드포인트는 `fetch` 핸들러의 method + pathname 분기로 추가하고, 마지막 404 응답(`server/index.ts:215`) 앞에 둔다.

## Testing Strategy

- 실행: `bun run test -- server/` (Vitest, `vite.config.ts:20`의 `server/**/*.test.ts` 포함 패턴).
- 테스트 파일은 대상 옆에 `<name>.test.ts`로 둔다.
- 외부 API는 호출하지 않는다. 폴백 테스트처럼 `vi.fn()`으로 시도 함수를 주입해 검증한다(`server/fallback.test.ts`).

## Local Golden Rules

- Do: 공급자별 실패 처리를 비교하고 맞춘다. 현재 Gemini 경로에만 모델 폴백(`server/index.ts:134-136`)과 `MAX_TOKENS` 잘림 검사(`server/index.ts:123`)가 있고 Anthropic 경로(`server/index.ts:68-96`)에는 없다. 한쪽만 고칠 때 이 비대칭이 의도인지 확인한다.
- Do: `ensureRenderCall`은 이미 `render(` 가 있으면 코드를 건드리지 않고, 없으면 대문자로 시작하는 첫 `const`/`function` 선언을 렌더링한다(`server/generator.ts:17-21`). 정규식을 바꾸면 `server/generator.test.ts`에 케이스를 추가한다.
- Don't: Gemini 키는 URL 쿼리에 들어간다(`server/index.ts:99`). 요청 URL을 로그로 남기거나 에러 메시지에 포함하지 않는다.
- Don't: `resolveApiKey`의 우선순위(클라이언트 입력 > 서버 환경변수, `server/index.ts:65`)를 바꾸지 않는다. UI가 "직접 입력으로 덮어쓰기 가능"을 안내한다(`src/App.tsx:105`).
- Don't: `withModelFallback`은 모든 실패를 삼키고 마지막 에러만 던진다(`server/fallback.ts:15-19`). 앞 모델의 429/503 정보가 필요해지면 이 함수를 수정하고, 호출부에서 우회하지 않는다.
