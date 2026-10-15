# AGENTS.md

프롬프트를 받아 AI(Anthropic / Gemini)로 React 컴포넌트 코드를 생성하고, 브라우저에서 react-live로 즉시 렌더링하는 도구. 프로젝트 소개와 실행 안내는 `README.md`를 따른다.

Tech Stack: Bun, React 19, TypeScript 5.9, Vite 8, react-live 4, Vitest 4, ESLint 9

## Operational Commands

- 패키지 매니저는 `bun` 고정. `bun.lock`만 유지하며 npm/yarn/pnpm 명령과 lock 파일을 만들지 않는다.
- 개발 실행: `bun run dev` (API 서버 :3002 + Vite :5173 동시 실행, `package.json:7`)
- API 서버만: `bun run server` (`bun --watch`, `package.json:8`)
- 테스트: `bun run test` (Vitest). `bun test`를 쓰지 않는다. Bun 내장 러너가 실행되어 `vite.config.ts`의 jsdom 설정을 읽지 못하고 DOM 테스트 3개가 실패한다.
- 단일 파일 테스트: `bun run test -- server/generator.test.ts`
- 린트: `bun run lint`
- 타입 체크 + 빌드: `bun run build` (`tsc -b && vite build`)
- 작업 완료 전 `bun run test`, `bun run lint`, `bun run build`를 모두 통과시킨다.

## Golden Rules

### Immutable

- API 키는 서버(`process.env`)에서만 읽는다. `server/index.ts:59-62`의 `ENV_KEYS`가 유일한 진입점이며, 클라이언트에는 `/api/config`가 키 존재 여부(boolean)만 내려준다(`server/index.ts:150-153`). 키 값 자체를 응답·로그·에러 메시지에 넣지 않는다.
- 클라이언트 코드(`src/`)에서 `import.meta.env`로 API 키를 읽거나 `VITE_` 접두사 환경변수를 만들지 않는다. Vite는 `VITE_` 변수를 번들에 그대로 포함한다.
- `.env`는 커밋하지 않는다(`.gitignore:32`). 워크트리에는 `.worktreeinclude`로 복사된다.

### Do's

- AI 공급자(Provider)를 추가·변경할 때는 세 곳을 함께 수정한다: `server/index.ts:57`(`Provider` 타입), `server/index.ts:59`(`ENV_KEYS`), `src/types/index.ts:1`(`Provider` 타입) 및 `src/App.tsx:8`(`PROVIDER_CONFIG`). 서버와 클라이언트 타입은 공유되지 않아 한쪽만 바꿔도 컴파일 에러가 나지 않는다.
- 생성 코드 형식 규칙은 두 겹으로 지킨다. `SYSTEM_PROMPT`(`server/index.ts:11-16,20`)가 import 금지·`render()` 호출·코드펜스 금지·순수 JS를 요구하고, 응답 후 `stripCodeFences`·`ensureRenderCall`(`server/index.ts:188`)이 다시 정규화한다. 프롬프트를 고쳤다고 후처리를 제거하지 않는다(이중 방어).
- 테스트 가능한 로직은 부수효과 없는 모듈(`server/generator.ts`, `server/fallback.ts`)에 두고 테스트를 함께 추가한다. `server/index.ts`는 import 시 `Bun.serve`가 실행되어(`server/index.ts:138`) 단위 테스트 대상이 아니다.
- 테스트 이름과 주석은 한국어로 작성한다(`server/generator.test.ts:5`, `src/components/PromptInput.test.tsx:7`).
- 타입만 가져올 때는 `import type`을 쓴다(`verbatimModuleSyntax`, `tsconfig.app.json:14`). `enum`·`namespace` 같은 비소거 문법은 쓰지 않는다(`erasableSyntaxOnly`, `tsconfig.app.json:23`).

### Don'ts

- API 서버 포트(3002, `server/index.ts:139`)와 Vite 프록시 대상(`vite.config.ts:11`)을 따로 바꾸지 않는다. 둘이 어긋나면 `/api/*` 요청이 모두 실패한다.
- 서버 에러를 HTTP 상태로 바꾸는 로직은 에러 메시지 문자열에 의존한다(`server/index.ts:194,201`이 `'503'`, `'429'`를 검색). `callAnthropic`/`callGoogleModel`의 `throw new Error(\`... API error: ${status}\`)` 형식(`server/index.ts:85,112`)을 바꾸면 사용자 안내 메시지가 500으로 떨어진다.
- `server/`는 어떤 tsconfig의 `include`에도 없어(`tsconfig.app.json:27`, `tsconfig.node.json:25`) `bun run build`가 서버 타입 오류를 잡지 못한다. 서버 수정 후에는 `bun run test`와 `bun run server` 기동으로 직접 확인한다.

## Standards & References

- 코드 스타일은 ESLint 설정(`eslint.config.js`)과 tsconfig strict 옵션을 따른다. 별도 포매터는 없으므로 주변 코드의 따옴표·세미콜론 스타일을 맞춘다.
- 커밋 메시지: `<type>: <한국어 요약>`, type은 `feat | fix | refactor | chore`. 상세 절차는 `.claude/skills/commit/SKILL.md`.
- `hiring-lab/`은 앱과 무관한 이력서 검토 실습 자료다. 앱 작업 시 수정하지 않는다.
- Maintenance Policy: 이 문서의 규칙·라인 번호가 실제 코드와 어긋나면 작업을 마친 뒤 AGENTS.md 수정을 제안한다.

## Context Map

- **[API 서버 수정 (Bun)](./server/AGENTS.md)** — AI 호출, 모델 폴백, 응답 정규화, 엔드포인트 작업 시.
- **[UI 수정 (React/react-live)](./src/AGENTS.md)** — 컴포넌트, 훅, 미리보기, 프론트 테스트 작업 시.
