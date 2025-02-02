import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import Suggestion from '../src/pages/components/Suggestion';
import axios from 'axios';
import '@testing-library/jest-dom';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock the environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

interface SuggestionType {
  id: number;
  document_id: number;
  rewritten_text: string;
}

describe('Suggestion Component', () => {
  const mockSuggestion: SuggestionType = {
    id: 1,
    document_id: 123,
    rewritten_text: 'Rewritten text for better confidence'
  };

  const mockOnSuggestionUpdate = jest.fn();
  const mockSetText = jest.fn();
  const mockAuthToken = 'mock-auth-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockAuthToken);
  });

  it('renders suggestion with rewritten text', () => {
    const { getByText } = render(
      <Suggestion 
        suggestion={mockSuggestion} 
        onSuggestionUpdate={mockOnSuggestionUpdate}
        setText={mockSetText}
      />
    );
    expect(getByText(/Rewritten text for better confidence/i)).toBeInTheDocument();
  });

  it('calls delete API with auth token when delete button is clicked', async () => {
    const { getByAltText } = render(
      <Suggestion 
        suggestion={mockSuggestion} 
        onSuggestionUpdate={mockOnSuggestionUpdate}
        setText={mockSetText}
      />
    );
    const deleteButton = getByAltText('trash-icon');

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `${API_URL}/fix/${mockSuggestion.document_id}/suggestions/${mockSuggestion.id}`,
        {
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        }
      );
      expect(mockOnSuggestionUpdate).toHaveBeenCalled();
    });
  });

  it('calls update API with auth token when apply button is clicked', async () => {
    const mockResponse = {
      data: { updated_text: 'Updated document text' }
    };
    mockedAxios.put.mockResolvedValueOnce(mockResponse);

    const { getByText } = render(
      <Suggestion 
        suggestion={mockSuggestion} 
        onSuggestionUpdate={mockOnSuggestionUpdate}
        setText={mockSetText}
      />
    );
    const applyButton = getByText(/Apply/i);

    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${API_URL}/fix/${mockSuggestion.document_id}/suggestions/${mockSuggestion.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${mockAuthToken}` }
        }
      );
      expect(mockSetText).toHaveBeenCalledWith('Updated document text');
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedAxios.put.mockRejectedValueOnce(new Error('API Error'));

    const { getByText } = render(
      <Suggestion 
        suggestion={mockSuggestion} 
        onSuggestionUpdate={mockOnSuggestionUpdate}
        setText={mockSetText}
      />
    );
    const applyButton = getByText(/Apply/i);

    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
      expect(mockSetText).not.toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
