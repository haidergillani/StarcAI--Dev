import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import SearchBar from '../src/pages/components/SearchBar';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

describe('SearchBar Component', () => {
  const mockOnSearchComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search bar', () => {
    const { getByPlaceholderText } = render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    expect(getByPlaceholderText(/Document name or keywords.../i)).toBeInTheDocument();
  });

  it('updates the query state on input change', () => {
    const { getByPlaceholderText } = render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    const input = getByPlaceholderText(/Document name or keywords.../i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input.value).toBe('test query');
  });

  it('calls the search API on form submission', () => {
    const { getByPlaceholderText, getByText } = render(<SearchBar onSearchComplete={mockOnSearchComplete} />);
    const input = getByPlaceholderText(/Document name or keywords.../i) as HTMLInputElement;
    const searchButton = getByText(/Search/i);

    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(searchButton);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/api/search`, {
      params: {
        q: 'test query',
      },
    });
  });
});
