import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';

vi.mock('../../services/db', () => ({
  getAllQueueItems: vi.fn(async () => []),
  saveQueueItem: vi.fn(async () => {}),
  getQueueItemByCanonical: vi.fn(async () => undefined),
  deleteQueueItem: vi.fn(async () => {}),
  saveItemImages: vi.fn(async () => {}),
}));

describe('App component', () => {
  it('renders application header and URL input', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('Tappytoon Scraper')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste Tappytoon episode URL/i)).toBeInTheDocument();
  });

  it('updates URL state when typing and shows clear button', async () => {
    await act(async () => {
      render(<App />);
    });
    const input = screen.getByPlaceholderText(/Paste Tappytoon episode URL/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'https://www.tappytoon.com/en/comics/solo-leveling/1' } });
    });
    expect(input).toHaveValue('https://www.tappytoon.com/en/comics/solo-leveling/1');
  });
});
