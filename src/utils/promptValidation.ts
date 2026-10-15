export const MAX_PROMPT_LENGTH = 500;

export interface PromptValidationResult {
  valid: boolean;
  length: number;
  error: string | null;
}

export function validatePromptLength(prompt: string): PromptValidationResult {
  // 실제 전송값(trim) 기준, 이모지가 2자로 세지지 않도록 코드 포인트 단위로 센다.
  const length = [...prompt.trim()].length;
  if (length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      length,
      error: `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하로 입력해주세요. (현재 ${length}자)`,
    };
  }
  return { valid: true, length, error: null };
}
