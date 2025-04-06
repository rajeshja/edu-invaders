import React from 'react';
import { MathQuestion } from '../math/QuestionGenerator';

interface QuestionDisplayProps {
  question: MathQuestion | null;
  onAnswerSelected: (answer: number) => void;
  isAnswered: boolean; // To disable buttons after selection
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  onAnswerSelected,
  isAnswered,
}) => {
  if (!question) {
    return <div>Loading question...</div>;
  }

  return (
    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#333', borderRadius: '8px' }}>
      <h2>{question.text}</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onAnswerSelected(option)}
            disabled={isAnswered}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};