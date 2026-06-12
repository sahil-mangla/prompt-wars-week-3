import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter Hook', () => {
  it('types out the text character by character', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useTypewriter('Hello', 10));

    expect(result.current.displayed).toBe('');
    expect(result.current.done).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(25);
    });

    expect(result.current.displayed.length).toBeGreaterThan(0);
    expect(result.current.displayed.length).toBeLessThan(5);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.displayed).toBe('Hello');
    expect(result.current.done).toBe(true);

    vi.useRealTimers();
  });
});
