import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

// 제한(500자)을 1자 넘는 프롬프트를 입력한다.
async function pasteOverLimit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('textbox'));
  await user.paste('가'.repeat(501));
}

describe('PromptInput', () => {
  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });

  it('500자를 넘게 입력하면 생성 버튼이 비활성이다', async () => {
    const user = userEvent.setup();
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

    await pasteOverLimit(user);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('500자를 넘으면 에러 메시지를 보여준다', async () => {
    const user = userEvent.setup();
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

    await pasteOverLimit(user);
    expect(screen.getByRole('alert')).toHaveTextContent(
      '프롬프트는 500자 이하로 입력해주세요. (현재 501자)',
    );
  });

  it('현재 글자 수와 최대 글자 수를 보여준다', async () => {
    const user = userEvent.setup();
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    expect(screen.getByText('6 / 500')).toBeInTheDocument();
  });

  it('500자를 넘으면 Cmd+Enter로 제출해도 onGenerate가 호출되지 않는다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await pasteOverLimit(user);
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onGenerate).not.toHaveBeenCalled();
  });
});
