import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Suggestion from '../src/pages/components/Suggestion';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

interface SuggestionType {
  id: number;
  type: string;
  content: string;
  document_id: number;
  input_text_chunk: string;
  rewritten_text: string;
}

describe('Suggestion Component', () => {
  const mockSuggestion: SuggestionType = {
    id: 1,
    type: 'confidence',
    content: 'Test content',
    document_id: 123,
    input_text_chunk: 'Original text',
    rewritten_text: 'Rewritten text'
  };

  const mockOnSuggestionUpdate = jest.fn();
  const mockSetText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders suggestion with content and type', () => {
    const { getByText } = render(
      <Suggestion 
        suggestion={mockSuggestion} 
        onSuggestionUpdate={mockOnSuggestionUpdate}
        setText={mockSetText}
      />
    );
    expect(getByText(/Test content/i)).toBeInTheDocument();
    expect(getByText(/improve your confidence score/i)).toBeInTheDocument();
  });

  it('calls delete API when delete button is clicked', async () => {
    const { getByAltText } = render(
      <Suggestion 
        suggestion={mockSuggestion} 
        onSuggestionUpdate={mockOnSuggestionUpdate}
        setText={mockSetText}
      />
    );
    const deleteButton = getByAltText('trash-icon');

    fireEvent.click(deleteButton);

    expect(mockedAxios.delete).toHaveBeenCalledWith(`${API_URL}/fix/123/1`);
    expect(mockOnSuggestionUpdate).toHaveBeenCalled();
  });

  it('calls update API when rephrase button is clicked', async () => {
    const { getByText } = render(
      <Suggestion 
        suggestion={mockSuggestion} 
        onSuggestionUpdate={mockOnSuggestionUpdate}
        setText={mockSetText}
      />
    );
    const rephraseButton = getByText(/Rephrase/i);

    fireEvent.click(rephraseButton);

    expect(mockedAxios.put).toHaveBeenCalledWith(`${API_URL}/fix/123/1`);
    expect(mockOnSuggestionUpdate).toHaveBeenCalled();
  });
});
