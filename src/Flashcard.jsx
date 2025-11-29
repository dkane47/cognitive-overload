// src/components/Flashcard.jsx
import React, { useState } from "react";

export default function Flashcard({ question, answer }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="flashcard"
      onClick={() => setFlipped(!flipped)}
    >
      <div>{flipped ? answer : question}</div>
      <div><button>Next Card</button><button>Show Answer</button></div>
    </div>
  );
}
