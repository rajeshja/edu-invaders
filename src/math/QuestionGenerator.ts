export interface MathQuestion {
    text: string;
    options: number[];
    correctAnswer: number;
  }
  
  export class QuestionGenerator {
    // Generates a simple single-digit addition question
    static generateAdditionQuestion(): MathQuestion {
      const num1 = Math.floor(Math.random() * 10); // 0-9
      const num2 = Math.floor(Math.random() * 10); // 0-9
      const correctAnswer = num1 + num2;
  
      const options: number[] = [correctAnswer];
      while (options.length < 4) {
        const wrongAnswerOffset = Math.floor(Math.random() * 5) + 1; // 1-5
        const wrongAnswer = Math.random() > 0.5
          ? correctAnswer + wrongAnswerOffset
          : Math.max(0, correctAnswer - wrongAnswerOffset); // Ensure non-negative
  
        if (!options.includes(wrongAnswer)) {
          options.push(wrongAnswer);
        }
      }
  
      // Shuffle options
      options.sort(() => Math.random() - 0.5);
  
      return {
        text: `${num1} + ${num2} = ?`,
        options,
        correctAnswer,
      };
    }
  }