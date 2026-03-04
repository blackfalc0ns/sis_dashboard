import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GuardedLink from '../GuardedLink';

// Mock the useGuardedRouter hook
const mockGuardedPush = vi.fn();

vi.mock('@/hooks/useGuardedRouter', () => ({
  useGuardedRouter: () => ({
    guardedPush: mockGuardedPush,
  }),
}));

describe('GuardedLink Component', () => {
  beforeEach(() => {
    mockGuardedPush.mockClear();
  });

  it('renders link with children', () => {
    render(<GuardedLink href="/test">Test Link</GuardedLink>);
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('preserves Cmd+Click for new tab', () => {
    render(<GuardedLink href="/test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate Cmd+Click (metaKey)
    fireEvent.click(link, { metaKey: true });
    
    // Should not call guardedPush
    expect(mockGuardedPush).not.toHaveBeenCalled();
  });

  it('preserves Ctrl+Click for new tab', () => {
    render(<GuardedLink href="/test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate Ctrl+Click
    fireEvent.click(link, { ctrlKey: true });
    
    // Should not call guardedPush
    expect(mockGuardedPush).not.toHaveBeenCalled();
  });

  it('preserves middle click', () => {
    render(<GuardedLink href="/test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate middle click (button 1)
    fireEvent.click(link, { button: 1 });
    
    // Should not call guardedPush
    expect(mockGuardedPush).not.toHaveBeenCalled();
  });

  it('calls guardedPush on plain left click', () => {
    render(<GuardedLink href="/test">Test Link</GuardedLink>);
    const link = screen.getByText('Test Link');
    
    // Simulate plain left click
    fireEvent.click(link);
    
    // Should call guardedPush
    expect(mockGuardedPush).toHaveBeenCalledWith('/test');
  });

  it('applies custom className', () => {
    render(
      <GuardedLink href="/test" className="custom-class">
        Test Link
      </GuardedLink>
    );
    const link = screen.getByText('Test Link');
    expect(link).toHaveClass('custom-class');
  });
});
