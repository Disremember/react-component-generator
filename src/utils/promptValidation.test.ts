import { describe, it, expect } from 'vitest';
import { validatePromptLength } from './promptValidation';

describe('validatePromptLength', () => {
  it('500자 이하 프롬프트는 유효하다', () => {
    const result = validatePromptLength('프로필 카드');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('500자를 넘으면 유효하지 않고 에러 메시지를 반환한다', () => {
    const result = validatePromptLength('가'.repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('프롬프트는 500자 이하로 입력해주세요. (현재 501자)');
  });

  it('정확히 500자는 유효하다', () => {
    expect(validatePromptLength('가'.repeat(500)).valid).toBe(true);
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    const result = validatePromptLength(`  ${'가'.repeat(500)}\n `);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(500);
  });

  it('이모지는 1자로 센다', () => {
    const result = validatePromptLength('😀'.repeat(500));
    expect(result.valid).toBe(true);
    expect(result.length).toBe(500);
  });
});
