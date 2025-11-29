import { useState } from 'react'
import { useEffect } from "react";
import './App.css'
import germanStates from './data/germanStates'
import coloradoMountains from './data/coloradoMountains';
import chineseDynasties from './data/chineseDynasties';

const decks = {
  germanStates,
  coloradoMountains,
  chineseDynasties
};

function generateRandomOrder(length) {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalize(str) {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")              // break accented characters into parts
    .replace(/[\u0300-\u036f]/g, "")  // remove accents
    .replace(/\s+/g, " ");
}

function App() {
  //display elements of state
  const [userAnswer, setUserAnswer] = useState('')
  const [showQuestion, setShowQuestion] = useState(true);
  const [currentCard, setCurrentCard] = useState({front:"",back:""});

  //logic elements of state
  const [selectedDeck, setSelectedDeck] = useState("germanStates");
  const cards = decks[selectedDeck];
  const [mode, setMode] = useState(false); //for changing from random to intelligent, stay with random for now (false is random)
  const [toLearnList,setToLearnList] = useState([]); //list of indices that haven't been introduced yet
  const [learningIndex,setLearningIndex] = useState(2);
  const [learningList,setLearningList] = useState([]); //list of indices that are currently learning
  const [learnedList,setLearnedList] = useState([]); //list of indices that are being mixed randomly after learning
  const [lineup,setLineup] = useState([-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]); //rotating queue for next up
  const [index,setIndex] = useState(0); //index in the rotating queue (%10)
  const [progress, setProgress] = useState(
      () => new Array(cards.length).fill(0)
    );

  

  const processAnswer = () => {
    if (mode) { //do a bunch of stuff for intelligent mode
      const isCorrect = normalize(currentCard.back) === normalize(userAnswer);
      const currentQuestion = lineup[index];
      const currentProgress = progress[currentQuestion];
      
      if (!isCorrect) { //if wrong, bump up two spots and mark incorrect
        setLineup(prev => {
          const updated = [...prev];
          updated[(index + 2) % 10] = currentQuestion;
          updated[index] = -1;
          return updated;
        });
        markIncorrect(currentQuestion);
        if (!learningList.includes(currentQuestion)) {
          setLearningList(prev => {
            const updated = [...prev];
            updated.push(currentQuestion);
            return updated;
          });
        }
      } else if (currentProgress < 2) { //if <2, bump up two spots, mark correct
        setLineup(prev => {
          const updated = [...prev];
          updated[(index + 2) % 10] = currentQuestion;
          updated[index] = -1;
          return updated;
        });
        markCorrect(currentQuestion);
      } else if (currentProgress === 2) { //reset lineup and move to learnedList
        setLineup(prev => {
          const updated = [...prev];
          updated[index] = -1;
          return updated;
        });
        setLearningList(prev => {
            const updated = [...prev];
            updated.splice(updated.indexOf(currentQuestion),1);
            return updated;
          });
        if (!learnedList.includes(currentQuestion)) {
          setLearnedList(prev => {
            const updated = [...prev];
            updated.push(currentQuestion);
            return updated;
          });
        }
      } else {
        setLineup(prev => {
          const updated = [...prev];
          updated[index] = -1;
          return updated;
        });
      }
    }
    if (lineup[(index + 1) % 10] === -1) {
      if (learningList.length === 0) {
        setLineup(prev => {
          const updated = [...prev];
          updated[(index + 1) % 10] = toLearnList[learningIndex];
          return updated
        });
        setLearningList(prev => {
          const updated = [...prev];
          updated.push(toLearnList[learningIndex]);
          return updated;
        });
        setLearningIndex(learningIndex + 1);
      } else {
        setLineup(prev => {
          const updated = [...prev];
          updated[(index + 1) % 10] = learnedList[Math.floor(Math.random() * learnedList.length)];
          return updated
        });
      }
    }

    //increment index
    setIndex(prevIndex => {
      const newIndex = (prevIndex + 1) % lineup.length;
      return newIndex;
    });
    setShowQuestion(false);
    //run when answer is checked
    //does logic behind the scenes but doesn't do anything major besides update the display
    //increment index
    //based on stage + correctness, decide whether to a) increment stage, add to lineup,
    //b) not increment stage, add to lineup, c) move to learnedList, add to lineup
    //clear last card in lineup
  };

  const nextCard = () => {
    setUserAnswer("");

    setCurrentCard(cards[lineup[index]]);

    setShowQuestion(true); 
    //run when moving to next card
    //updates the visible elements of the system
    //currentCard logic = either next in lineup or random card from learnedList
  };

  function markCorrect(index) {
    setProgress(prev => {
      const updated = [...prev];
      updated[index] = prev[index] + 1;
      return updated;
    });
  }

  function markIncorrect(index) {
    setProgress(prev => {
      const updated = [...prev];
      updated[index] = 0;
      return updated;
    });
  }

  useEffect(() => {
    const order = generateRandomOrder(cards.length);
    setLineup([-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]);
    setIndex(0);
    setUserAnswer("");
    if (mode) {
      setToLearnList(order.slice(2));
      setCurrentCard(cards[order[0]]); // show the first random card
      setLearningList([order[0],order[1]]);
      setLineup(prev => {
        const updated = [...prev];
        updated[0] = order[0];
        updated[1] = order[1];
        return updated;
      });
    } else {
      setLineup(order);
      setCurrentCard(cards[order[0]]); // show the first random card
    }
    setShowQuestion(true);
  },[mode,selectedDeck]);

  return (
    <div className="app">
      <div className="controls">
        <select
          className="deck-select"
          value={selectedDeck}
          onChange={(e) => setSelectedDeck(e.target.value)}
        >
          <option value="germanStates">German States</option>
          <option value="coloradoMountains">Colorado Mountains</option>
          <option value="chineseDynasties">Chinese Dynasties</option>
        </select>
        <button className="mode-button" onClick={() => setMode(prev => !prev)}>
          {mode ? "Intelligent Mode" : "Random Mode"}
        </button>
      </div>
      <div className="flashcard">
        <div className="flashcard-content">
          <p className="qa">Q: {currentCard.front}</p>
          <p className="qa">{showQuestion ? "" : "A: " + currentCard.back}</p>
          <input
            type="text"
            className="answer-input"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (showQuestion) processAnswer();
                else nextCard();
              }
            }}
            placeholder="Type your answer..."
          />
          <button
            onClick={() => {
              if (showQuestion) processAnswer();
              else nextCard();
            }}
          >
            {showQuestion ? "Show Answer" : "Next Card"}
          </button>
        </div>
      </div>
      <div className="notes">
        {"lineup " + lineup.join(",")}
        <br></br>
        {"index " + index}
        <br></br>
        {"toLearnList " + toLearnList.join(",")}
        <br></br>
        {"learningList " + learningList.join(",")}
        <br></br>
        {"learnedList " + learnedList.join(",")}
        <br></br>
        {"progress " + progress.join(",")}
        <br></br>
      </div>
    </div>
  )
}

export default App