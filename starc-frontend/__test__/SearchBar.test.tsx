import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SearchBar from '../src/pages/components/SearchBar';
import '@testing-library/jest-dom';

describe('SearchBar Component', () => {
  const mockOnSearchComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the search bar', () => {
    render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    expect(screen.getByPlaceholderText(/Document name or keywords.../i)).toBeInTheDocument();
  });

  it('updates the query state on input change', () => {
    render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    const input = screen.getByPlaceholderText(/Document name or keywords.../i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input.value).toBe('test query');
  });

  it('calls onSearchComplete with empty string on initial render', () => {
    render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    expect(mockOnSearchComplete).toHaveBeenCalledWith('');
  });

  it('debounces search on input change', async () => {
    render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    const input = screen.getByPlaceholderText(/Document name or keywords.../i) as HTMLInputElement;

    // Clear initial call
    mockOnSearchComplete.mockClear();

    // Type in the search query
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Fast-forward timers
    jest.advanceTimersByTime(400);
    expect(mockOnSearchComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockOnSearchComplete).toHaveBeenCalledWith('test');
  });

  it('cancels debounced search on unmount', () => {
    const { unmount } = render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    const input = screen.getByPlaceholderText(/Document name or keywords.../i) as HTMLInputElement;

    // Clear initial call
    mockOnSearchComplete.mockClear();

    // Type in the search query
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Unmount before debounce timeout
    unmount();
    
    // Fast-forward timers
    jest.advanceTimersByTime(500);
    expect(mockOnSearchComplete).not.toHaveBeenCalled();
  });
});
