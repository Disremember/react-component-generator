# src/AGENTS.md

## Module Context

Vite로 번들되는 React 19 클라이언트. 프롬프트와 공급자·API 키를 입력받아 `/api/generate`를 호출하고, 결과 코드를 react-live로 렌더링한다. 서버와는 Vite 프록시(`vite.config.ts:9-14`)로만 통신한다.

## Tech Stack & Constraints

- 상태 관리는 React 내장 훅만 쓴다. 생성 요청 로직은 `hooks/useComponentGenerator.ts`에 모은다.
- API 호출은 상대 경로 `/api/...`로 한다(`src/App.tsx:25`, `src/hooks/useComponentGenerator.ts:23`). `http://localhost:3002`를 직접 쓰면 프록시를 우회해 배포·포트 변경 시 깨진다.
- 스타일은 `App.css`, `index.css`의 BEM 유사 클래스(`key-status--ready`, `tab--active`)를 따른다. CSS-in-JS 라이브러리를 추가하지 않는다.
- 공용 타입은 `types/index.ts`에 둔다.

## Implementation Patterns

- 컴포넌트는 named export 함수형 컴포넌트, props 타입은 같은 파일의 `interface <Name>Props`로 선언한다(`src/components/LivePreview.tsx:3-7`). 예외는 `App.tsx`의 default export.
- UI 문구는 한국어, 접근성 라벨은 `aria-label`로 붙인다(`src/components/ComponentCard.tsx:35`).

## Testing Strategy

- 실행: `bun run test -- src/` (jsdom 환경, setup은 `src/test/setup.ts`).
- 테스트 파일은 컴포넌트 옆에 `<Name>.test.tsx`로 둔다.
- Testing Library의 role 기반 쿼리와 `userEvent.setup()`을 쓴다(`src/components/PromptInput.test.tsx:9,14`). 버튼은 화면에 보이는 한국어 이름으로 찾는다.
- 현재 테스트는 `PromptInput`에만 있다. `useComponentGenerator`·`ComponentCard`를 바꿀 때는 `fetch`를 `vi.fn()`으로 대체한 테스트를 함께 추가한다.

## Local Golden Rules

- Do: 생성 코드는 `LiveProvider`에 `noInline`으로 넘긴다(`src/components/LivePreview.tsx:14`). 이 모드는 코드 안의 `render(...)` 호출로만 화면을 그리므로, 서버의 `ensureRenderCall`(`server/generator.ts:16`)과 짝을 이룬다. 둘 중 하나만 바꾸지 않는다.
- Do: 미리보기 재실행은 `key`를 바꿔 리마운트하는 방식이다(`src/components/ComponentCard.tsx:33,70`). 애니메이션 재생도 이 방식에 의존한다.
- Don't: 사용자가 입력한 API 키를 `localStorage`·URL·로그에 저장하지 않는다. 현재는 컴포넌트 state에만 있고 공급자를 바꾸면 비운다(`src/App.tsx:14,43`).
- Don't: 키 입력 검사를 클라이언트에서만 하지 않는다. `.env` 키가 있으면 빈 입력으로도 요청을 보내고(`src/App.tsx:34`), 최종 판단은 서버의 `resolveApiKey`가 400으로 응답한다(`server/index.ts:169-174`). 클라이언트 검사를 강화하더라도 서버 검사는 유지한다.
