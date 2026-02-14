"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

interface BehavioralQuestion {
  id: number;
  question: string;
  category: string;
  tips?: string;
}

const behavioralQuestions: BehavioralQuestion[] = [
  {
    id: 1,
    question:
      "Tell me about a time in which you had a conflict and needed to influence somebody else.",
    category: "Conflict Resolution",
    tips: "Use STAR method: Situation, Task, Action, Result. Focus on how you influenced positively.",
  },
  {
    id: 2,
    question: "What project are you currently working on?",
    category: "Current Work",
    tips: "Talk about LifeThon! Mention the gacha system, infrastructure setup, etc.",
  },
  {
    id: 3,
    question: "What is the most challenging aspect of your current project?",
    category: "Problem Solving",
    tips: "Discuss technical challenges like implementing pity system, handling concurrent gacha pulls, etc.",
  },
  {
    id: 4,
    question:
      "What was the most difficult bug that you fixed in the past 6 months?",
    category: "Debugging",
    tips: "Describe the bug, debugging process, root cause, and solution. Show systematic approach.",
  },
  {
    id: 5,
    question:
      "How do you tackle challenges? Name a difficult challenge you faced while working on a project, how you overcame it, and what you learned.",
    category: "Problem Solving",
    tips: "Break down your approach: analyze, research, implement, test, iterate.",
  },
  {
    id: 6,
    question: "What are you excited about?",
    category: "Motivation",
    tips: "Technology, learning, impact. Be genuine and enthusiastic!",
  },
  {
    id: 7,
    question: "What frustrates you?",
    category: "Self-awareness",
    tips: "Turn negative into positive. E.g., 'Inefficiency frustrates me, which drives me to automate.'",
  },
  {
    id: 8,
    question:
      "Imagine it is your first day here at the company. What do you want to work on? What features would you improve on?",
    category: "Initiative",
    tips: "Research AWS services beforehand. Mention monitoring, automation, documentation improvements.",
  },
  {
    id: 9,
    question:
      "What are the most interesting projects you have worked on and how might they be relevant to this company's environment?",
    category: "Experience",
    tips: "Connect LifeThon infrastructure work to AWS operations. Highlight transferable skills.",
  },
  {
    id: 10,
    question: "Tell me about a time you had a disagreement with your manager.",
    category: "Conflict Resolution",
    tips: "Show professionalism, data-driven approach, and ability to compromise. End positively.",
  },
  {
    id: 11,
    question:
      "Talk about a project you are most passionate about, or one where you did your best work.",
    category: "Passion",
    tips: "LifeThon is perfect here! Show enthusiasm for the tech stack and problem-solving.",
  },
  {
    id: 12,
    question: "What does your best day of work look like?",
    category: "Work Style",
    tips: "Balance coding, collaboration, learning. Mention solving tough problems and helping teammates.",
  },
  {
    id: 13,
    question:
      "What is something that you had to push for in your previous projects?",
    category: "Leadership",
    tips: "Advocating for better practices: testing, documentation, automation, security.",
  },
  {
    id: 14,
    question:
      "What is the most constructive feedback you have received in your career?",
    category: "Growth Mindset",
    tips: "Show you accept feedback well and act on it. Demonstrate growth.",
  },
  {
    id: 15,
    question: "What is something you had to persevere at for multiple months?",
    category: "Perseverance",
    tips: "Long-term project or learning curve. Show dedication and eventual success.",
  },
  {
    id: 16,
    question: "Tell me about a time you met a tight deadline.",
    category: "Time Management",
    tips: "Prioritization, communication, focus. Mention how you managed scope and delivered.",
  },
  {
    id: 17,
    question:
      "If this were your first annual review with our company, what would I be telling you right now?",
    category: "Self-assessment",
    tips: "Highlight reliability, learning agility, collaboration, and impact on team goals.",
  },
  {
    id: 18,
    question:
      "Time management has become a necessary factor in productivity. Give an example of a time-management skill you've learned and applied at work.",
    category: "Time Management",
    tips: "Talk about prioritization frameworks, task batching, or tools you use.",
  },
  {
    id: 19,
    question:
      "Tell me about a problem you've had getting along with a work associate.",
    category: "Conflict Resolution",
    tips: "Focus on resolution and learning. Show emotional intelligence and professionalism.",
  },
  {
    id: 20,
    question: "What aspects of your work are most often criticized?",
    category: "Self-awareness",
    tips: "Pick something minor and show how you're improving. E.g., 'Over-engineering solutions.'",
  },
  {
    id: 21,
    question: "How have you handled criticism of your work?",
    category: "Growth Mindset",
    tips: "Show openness, reflection, and action. Criticism leads to improvement.",
  },
  {
    id: 22,
    question:
      "What strengths do you think are most important for your job position?",
    category: "Self-assessment",
    tips: "For Systems Engineer: troubleshooting, automation, communication, learning agility.",
  },
  {
    id: 23,
    question: "What words would your colleagues use to describe you?",
    category: "Self-awareness",
    tips: "Reliable, collaborative, curious, thorough. Back up with examples if asked.",
  },
  {
    id: 24,
    question:
      "What would you hope to achieve in the first six months after being hired?",
    category: "Goals",
    tips: "Learn systems, contribute to ops excellence, automate manual tasks, earn trust.",
  },
  {
    id: 25,
    question: "Tell me why you will be a good fit for the position.",
    category: "Fit",
    tips: "Match your skills to job description. Mention LifeThon experience with AWS, automation.",
  },
  {
    id: 26,
    question: "What are you looking for in your next role?",
    category: "Motivation",
    tips: "Growth, impact, learning, team culture. Align with AWS values: customer obsession, ownership.",
  },
];

const FlashcardPractice = () => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(behavioralQuestions.map((q) => q.category))),
  ];

  const filteredQuestions =
    filter === "All"
      ? behavioralQuestions
      : behavioralQuestions.filter((q) => q.category === filter);

  const currentCard = filteredQuestions[currentIndex];
  const progress = (studiedCards.size / behavioralQuestions.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setStudiedCards((prev) => new Set(prev).add(currentCard.id));
    setIsFlipped(false);
    setShowTips(false);
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setShowTips(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(filteredQuestions.length - 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      handleFlip();
    } else if (e.code === "ArrowRight") {
      handleNext();
    } else if (e.code === "ArrowLeft") {
      handlePrevious();
    }
  };

  useState(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">
                🃏 Behavioral Interview Practice
              </h1>
              <p className="text-gray-600 mt-1">
                Amazon Associate Systems Engineer Prep
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-2xl font-bold text-indigo-600">
                {studiedCards.size} / {behavioralQuestions.length}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setFilter(category);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === category
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-indigo-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Total Questions</p>
            <p className="text-2xl font-bold text-gray-800">
              {behavioralQuestions.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Current Set</p>
            <p className="text-2xl font-bold text-indigo-600">
              {filteredQuestions.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-gray-500">Studied</p>
            <p className="text-2xl font-bold text-green-600">
              {studiedCards.size}
            </p>
          </div>
        </div>

        {/* Flashcard */}
        <div className="perspective-1000">
          <div
            className={`relative bg-white rounded-2xl shadow-2xl p-12 min-h-[400px] cursor-pointer transition-all duration-500 transform hover:scale-[1.02] ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={handleFlip}
          >
            {!isFlipped ? (
              // Front of card - Question
              <div className="flex flex-col items-center justify-center h-full">
                <div className="absolute top-6 right-6">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                    {currentCard.category}
                  </span>
                </div>
                <div className="absolute top-6 left-6 text-gray-400 font-semibold">
                  {currentIndex + 1} / {filteredQuestions.length}
                </div>

                <div className="text-6xl mb-8">❓</div>
                <h2 className="text-2xl font-bold text-gray-800 text-center leading-relaxed">
                  {currentCard.question}
                </h2>

                <div className="absolute bottom-6 text-gray-400 text-sm">
                  Click or press SPACE to reveal tips
                </div>
              </div>
            ) : (
              // Back of card - Tips
              <div className="flex flex-col h-full rotate-y-180">
                <div className="absolute top-6 right-6">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    Tips
                  </span>
                </div>

                <div className="text-5xl mb-6">💡</div>

                <div className="space-y-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    How to Answer:
                  </h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {currentCard.tips}
                  </p>

                  <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm font-semibold text-yellow-800 mb-2">
                      🎯 STAR Method:
                    </p>
                    <ul className="text-sm text-yellow-900 space-y-1">
                      <li>
                        <strong>S</strong>ituation - Set the context
                      </li>
                      <li>
                        <strong>T</strong>ask - Describe the challenge
                      </li>
                      <li>
                        <strong>A</strong>ction - Explain what you did
                      </li>
                      <li>
                        <strong>R</strong>esult - Share the outcome and
                        learnings
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="absolute bottom-6 text-gray-400 text-sm">
                  Practice your answer out loud!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrevious}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition-colors font-semibold"
          >
            ← Previous
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleFlip}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors font-semibold"
            >
              {isFlipped ? "Show Question" : "Show Tips"}
            </button>
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition-colors font-semibold"
          >
            Next →
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold text-gray-700 mb-2">
            ⌨️ Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> - Flip
              card
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd> - Previous
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd> - Next
            </div>
          </div>
        </div>

        {/* Study Tips */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="font-bold text-indigo-900 mb-3 text-lg">
            📚 Study Tips
          </h3>
          <ul className="space-y-2 text-indigo-800">
            <li>✓ Practice answering each question out loud</li>
            <li>✓ Record yourself and listen back</li>
            <li>✓ Keep answers to 2-3 minutes maximum</li>
            <li>✓ Use the STAR method for structured responses</li>
            <li>✓ Prepare 2-3 strong examples that cover multiple questions</li>
            <li>✓ Focus on YOUR specific contributions and learnings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FlashcardPractice;
