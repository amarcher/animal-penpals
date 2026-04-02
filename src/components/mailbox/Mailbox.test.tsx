import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mailbox } from './Mailbox.tsx';
import { animals } from '../../data/animals.ts';

describe('Mailbox', () => {
  const defaultProps = {
    onSelectAnimal: vi.fn(),
    getUnreadCount: () => 0,
    hasThread: () => false,
  };

  it('renders all animal cards', () => {
    render(<Mailbox {...defaultProps} />);

    for (const animal of animals) {
      expect(screen.getByLabelText(`Write to ${animal.name}`)).toBeInTheDocument();
    }
  });

  it('renders title and subtitle', () => {
    render(<Mailbox {...defaultProps} />);

    expect(screen.getByAltText('Animal Penpals')).toBeInTheDocument();
    expect(screen.getByText('Pick an animal friend to write to!')).toBeInTheDocument();
  });

  it('clicking a card calls onSelectAnimal with correct id', async () => {
    const onSelectAnimal = vi.fn();
    render(<Mailbox {...defaultProps} onSelectAnimal={onSelectAnimal} />);

    await userEvent.click(screen.getByLabelText('Write to Ella the Elephant'));
    expect(onSelectAnimal).toHaveBeenCalledWith('elephant');
  });

  it('shows unread badge when count > 0', () => {
    const getUnreadCount = (id: string) => (id === 'dolphin' ? 3 : 0);
    render(<Mailbox {...defaultProps} getUnreadCount={getUnreadCount} />);

    expect(screen.getByLabelText('3 unread')).toBeInTheDocument();
  });

  it('shows "Continue writing" when hasThread returns true', () => {
    const hasThread = (id: string) => id === 'elephant';
    render(<Mailbox {...defaultProps} hasThread={hasThread} />);

    expect(screen.getByText('Continue writing')).toBeInTheDocument();
  });

  it('shows "Write a letter" when hasThread returns false', () => {
    render(<Mailbox {...defaultProps} />);

    const buttons = screen.getAllByText('Write a letter');
    expect(buttons.length).toBe(animals.length);
  });
});
