import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePhaserGame } from './hooks/usePhaserGame';
import { QuestionGenerator, MathQuestion } from './math/QuestionGenerator';
import { QuestionDisplay } from './components/QuestionDisplay';
import { GameScene, GameEvents } from './phaser/scenes/GameScene'; // Import GameScene for type checking

function App() {
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion | null>(null);
  const [isAnswered, setIsAnswered] = useState(false); // Prevent multiple answers per question
  const [feedback, setFeedback] = useState<string>(''); // Correct/Incorrect feedback

  // Ref to hold the game instance to call methods on its scenes
  const gameRef = useRef<Phaser.Game | null>(null);

  // --- Communication Layer ---
  // Define the functions that Phaser can call
  const gameEvents: GameEvents = {
    requestNewQuestion: useCallback(() => {
      console.log("React App: Received request for new question");
      setFeedback(''); // Clear previous feedback
      setCurrentQuestion(QuestionGenerator.generateAdditionQuestion());
      setIsAnswered(false); // Enable buttons for the new question
    }, []) // Empty dependency array ensures stable function reference
  };

  // Initialize Phaser using the custom hook
  const phaserGame = usePhaserGame(gameEvents);

  // Store the game instance in the ref once it's created
  useEffect(() => {
      if (phaserGame) {
          gameRef.current = phaserGame;
          console.log("React App: Phaser game instance stored in ref.");
      }
      return () => {
          // Optional: Clear ref on cleanup if needed, though usePhaserGame handles destruction
          // gameRef.current = null;
      };
  }, [phaserGame]);


  // Handler for when an answer button is clicked in the UI
  const handleAnswerSelected = (selectedAnswer: number) => {
    if (!currentQuestion || isAnswered) return; // Don't process if no question or already answered

    setIsAnswered(true); // Disable buttons immediately
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
        setFeedback('Correct! Firing!');
        console.log("React App: Correct answer selected.");
        // Tell the Phaser scene to fire
        const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | undefined;
        if (scene?.fireBullet) {
            scene.fireBullet();
            // Note: GameScene will request the next question *after* the bullet hits or misses
        } else {
            console.error("Could not get GameScene or fireBullet method not found.");
            // Fallback: request new question immediately if firing fails
             gameEvents.requestNewQuestion();
        }
    } else {
        setFeedback(`Incorrect. The answer was ${currentQuestion.correctAnswer}.`);
        console.log("React App: Incorrect answer selected.");
        // Just request a new question immediately on incorrect answer
        gameEvents.requestNewQuestion();
    }

    // Optional: Add a small delay before showing the next question on incorrect answer
    // setTimeout(() => {
    //   if (!isCorrect) {
    //      gameEvents.requestNewQuestion();
    //   }
    // }, 1000); // 1 second delay
  };

  return (
    <div>
      <h1>Math Invaders - Phase 1 Prototype</h1>
      {/* Container for the Phaser game canvas */}
      <div id="phaser-game-container" style={{ margin: '0 auto', width: '800px', height: '600px', border: '1px solid white' }}></div>

      {/* React UI for Questions */}
      <QuestionDisplay
        question={currentQuestion}
        onAnswerSelected={handleAnswerSelected}
        isAnswered={isAnswered}
      />
      {feedback && <p style={{ color: feedback.startsWith('Correct') ? 'lightgreen' : 'lightcoral', marginTop: '10px', fontWeight: 'bold' }}>{feedback}</p>}
    </div>
  );
}

export default App;