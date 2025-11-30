import { useState } from 'react'
import { useEffect } from "react";
import './App.css'

//import files for decks
import germanStates from './data/germanStates'
import coloradoMountains from './data/coloradoMountains';
import chineseDynasties from './data/chineseDynasties';
import jerseyShore from './data/jerseyShore';
import vicePresidents from './data/vicePresidents';
import bostonTStations from './data/bostonTStations';
import basketballColleges from './data/basketballColleges';
import obscureLandmarks from './data/obscureLandmarks';
import nonsense from './data/nonsense';


//create deck variables
const decks = {
  germanStates,
  coloradoMountains,
  chineseDynasties,
  jerseyShore,
  vicePresidents,
  bostonTStations,
  basketballColleges,
  obscureLandmarks,
  nonsense
};

//function to create a random array at launch
function generateRandomOrder(length) {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

//function to normalize strings for comparison
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
  const [mode, setMode] = useState('random'); //for changing from random to intelligent, stay with random for now (false is random)
  const [correct,setCorrect] = useState("false");
  const [toLearnList,setToLearnList] = useState([]); //list of indices that haven't been introduced yet
  const [learningIndex,setLearningIndex] = useState(0);
  const [learningList,setLearningList] = useState([]); //list of indices that are currently learning
  const [learnedList,setLearnedList] = useState([]); //list of indices that are being mixed randomly after learning
  const [alternate,setAlternate] = useState(false); //whether to pull a new card or wait
  const [lineup,setLineup] = useState([-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]); //rotating queue for next up
  const [index,setIndex] = useState(0); //index in the rotating queue (%10)
  const [progress, setProgress] = useState(
      () => new Array(cards.length).fill(0)
    );

  

  const processAnswer = () => {
    const oldLineup = [...lineup];
    const updatedLineup = [...oldLineup];
    const isCorrect = normalize(currentCard.back) === normalize(userAnswer); // store correctness
    setCorrect(isCorrect);
    if (mode === 'intelligent') { //do a bunch of stuff for intelligent mode
      const currentQuestion = oldLineup[index]; //store current question number
      const currentProgress = progress[currentQuestion]; //store progress on current question number
      
      if (!isCorrect) { //if wrong, bump up two spots and mark incorrect
        updatedLineup[(index + 2) % 10] = currentQuestion;
        updatedLineup[index] = -1;
        markIncorrect(currentQuestion);
        if (!learningList.includes(currentQuestion)) { //bump to learningList if wrong and not in learningList
          setLearningList(prev => {
            const updated = [...prev];
            updated.push(currentQuestion);
            return updated;
          });
        }
      } else if (currentProgress < 1) { //if <1, bump up two spots, mark correct
        updatedLineup[(index + 2) % 10] = currentQuestion;
        updatedLineup[index] = -1;
        markCorrect(currentQuestion);
      } else if (currentProgress === 1) { //if 1, reset lineup and move to learnedList
        updatedLineup[index] = -1;
        setLearningList(prev => { //remove from learningList
            const updated = [...prev];
            updated.splice(updated.indexOf(currentQuestion),1);
            return updated;
          });
          markCorrect(currentQuestion);
        if (!learnedList.includes(currentQuestion)) { //add to learnedList
          setLearnedList(prev => {
            const updated = [...prev];
            updated.push(currentQuestion);
            return updated;
          });
        }
      } else { //if progress is further
        updatedLineup[index] = -1;
        markCorrect(currentQuestion);
      }
    }
    if (oldLineup[(index + 1) % 10] === -1) { //logic if next card is -1
      if (learningList.length === 0 && learningIndex < toLearnList.length) { //add new card from toLearnList
        updatedLineup[(index + 1) % 10] = toLearnList[learningIndex];
        setLearningList(prev => {
          const updated = [...prev];
          updated.push(toLearnList[learningIndex]);
          return updated;
        });
        setLearningIndex(learningIndex + 1);
      } else { //or pull a random card from learnedList
        updatedLineup[(index + 1) % 10] = learnedList[Math.floor(Math.random() * learnedList.length)];
      }
    }

    //increment index
    setIndex(prevIndex => {
      const newIndex = (prevIndex + 1) % oldLineup.length;
      return newIndex;
    });
    setLineup(updatedLineup);
    setShowQuestion(false);
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
    if (mode === 'intelligent') {
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
          <option value="basketballColleges">Basketball Colleges</option>
          <option value="bostonTStations">Boston T Stations</option>
          <option value="jerseyShore">Jersey Shore Exits</option>
          <option value="vicePresidents">US Vice Presidents</option>
          <option value="obscureLandmarks">Obscure World Landmarks</option>
          <option value="nonsense">Nonsense</option>
        </select>
        <select
            className="mode-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="random">Random Mode</option>
            <option value="intelligent">Intelligent Mode</option>
          </select>
      </div>
      <div className="flashcard">
        <div className="flashcard-content">
          <p className="qa">Q: {currentCard.front}</p>
          <p className={correct ? "correct qa" : "incorrect qa"}>{showQuestion ? "" : "A: " + currentCard.back}</p>
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