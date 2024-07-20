import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Suggestion from '../components/Suggestion';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Suggestion Component', () => {
  const mockSuggestion = {
    id: 1,
    type: 'confidence',
    content: 'Test content',
    documentId: 123
  };

  const mockOnSuggestionUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders suggestion with content and type', () => {
    const { getByText } = render(<Suggestion suggestion={mockSuggestion} onSuggestionUpdate={mockOnSuggestionUpdate} />);
    expect(getByText(/Test content/i)).toBeInTheDocument();
    expect(getByText(/improve your confidence score/i)).toBeInTheDocument();
  });

  it('calls delete API when delete button is clicked', async () => {
    const { getByAltText } = render(<Suggestion suggestion={mockSuggestion} onSuggestionUpdate={mockOnSuggestionUpdate} />);
    const deleteButton = getByAltText('trash-icon');

    fireEvent.click(deleteButton);

    expect(mockedAxios.delete).toHaveBeenCalledWith(`https://starcai.onrender.com/fix/123/1`);
    expect(mockOnSuggestionUpdate).toHaveBeenCalled();
  });

  it('calls update API when rephrase button is clicked', async () => {
    const { getByText } = render(<Suggestion suggestion={mockSuggestion} onSuggestionUpdate={mockOnSuggestionUpdate} />);
    const rephraseButton = getByText(/Rephrase/i);

    fireEvent.click(rephraseButton);

    expect(mockedAxios.put).toHaveBeenCalledWith(`https://starcai.onrender.com/fix/123/1`);
    expect(mockOnSuggestionUpdate).toHaveBeenCalled();
  });
});
