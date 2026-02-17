"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";

interface BehavioralQuestion {
  id: number;
  question: string;
  category: string;
  tips?: string;
  answer?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

const behavioralQuestions: BehavioralQuestion[] = [
  {
    id: 1,
    question:
      "Tell me about a time in which you had a conflict and needed to influence somebody else.",
    category: "Conflict Resolution",
    tips: "Use STAR method: Situation, Task, Action, Result. Focus on how you influenced positively.",
    answer: {
      situation:
        "During my university capstone project, our team of six was building WaddleWait – a full-stack web application for restaurant waiters. We used React for the frontend, Django for the backend, and PostgreSQL for the database. In our first sprint, we committed to delivering a working prototype with user authentication and basic table management.\n\nI was responsible for the frontend, and a teammate handled the backend API. At sprint planning, we verbally agreed on the API endpoints and data formats, but we didn't document anything. Mid-sprint, the backend team made changes to the API – renaming fields and altering response structures – to accommodate database optimizations. They assumed I would notice, but they never communicated the changes. On the final day, when I tried to integrate, the application crashed.",
      task: "We missed the sprint deadline by three days. During the retrospective, blame fell mostly on me. Some teammates felt I should have been more proactive in checking the API or asking for updates. I felt frustrated because I genuinely didn't know the API had changed. My task was to defend myself without becoming defensive, and more importantly, to convince the team that the real problem wasn't any one person – it was that our communication process was broken. I needed to influence them to adopt better practices.",
      action:
        "I started by taking ownership of my part. I said: 'Yes, I could have asked for updates more frequently. I'll own that.' That immediately lowered the tension – people saw I wasn't trying to dodge responsibility.\n\nThen I calmly explained my perspective: 'But I also didn't know the API had changed because we had no formal way of communicating those changes. If we rely on verbal agreements and hope people notice, this will keep happening to someone else.'\n\nI didn't just complain – I came with solutions. I proposed:\n1. A daily 15-minute stand-up where everyone briefly shares what they're working on and any changes that might affect others.\n2. Pair programming sessions between frontend and backend members during API design, so we align early.\n3. A shared API documentation using something like Swagger or even just a living Google Doc that serves as the single source of truth.\n\nI framed it around the team's goal: 'We all want to deliver a great project and stop missing deadlines. These changes will help us catch issues early and save us from last-minute firefights.' I asked if we could try the daily stand-ups for just one week and see if it helped.",
      result:
        "The team agreed to try my suggestions. The daily stand-ups immediately improved visibility – we caught potential issues early because people spoke up. The pair programming sessions during API design meant frontend and backend were aligned before a single line of code was written. We also started documenting endpoints in a shared doc.\n\nThe result? We never missed another deadline. Our second sprint delivered on time, and integration became smooth. A few weeks later, one teammate even thanked me for pushing for those changes – they said it made the project less stressful for everyone.\n\nPersonally, I learned that influence isn't about being right or winning an argument. It's about taking accountability for your part, then focusing on solutions that help the whole team succeed. Even when you're blamed, you can lead by proposing better systems.",
    },
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
    answer: {
      situation:
        "While setting up the backend for LifeThon (Spring Boot + PostgreSQL), my application repeatedly failed to connect to the database with a 'connection refused' error. I initially assumed the database was running on the default port 5432, but the error persisted even after confirming the PostgreSQL service was active.\n\nI was responsible for setting up the entire infrastructure, including the database connection, authentication system, and API endpoints. The database connectivity was blocking progress on all features that required data persistence.",
      task: "I needed to resolve the connectivity issue quickly so I could continue developing authentication and other features that depended on the database. The pressure was high because this was blocking not just me, but potentially other team members who would need database access for their features.\n\nMy task was to systematically diagnose why the connection was failing despite PostgreSQL appearing to be running, and fix it without wasting time on trial-and-error guessing.",
      action:
        "I tackled this using my structured approach to challenges:\n\n1. Analyze: I checked the PostgreSQL service status using 'systemctl' – it was running. I then used 'netstat -ano | findstr :5432' to see if anything was listening on the default port. Nothing was.\n\n2. Research: I recalled that 'connection refused' often means the port is wrong or the service isn't bound to the expected address. I looked up how to check PostgreSQL's actual port by inspecting 'postgresql.conf'.\n\n3. Hypothesize: I suspected the port had been changed during installation, possibly to avoid conflicts with other services.\n\n4. Test: I opened 'postgresql.conf' and found 'port = 8080'. I verified that the PostgreSQL process was indeed listening on 8080 using 'netstat'.\n\n5. Implement: I updated my Spring Boot 'application.properties' to 'jdbc:postgresql://localhost:8080/LifeThon'.\n\n6. Test: I restarted the application and the connection succeeded.\n\n7. Iterate/Learn: I documented the actual port in our project wiki and added a note to always verify infrastructure configuration instead of assuming defaults. I also shared this with my team during stand-up so everyone was aware.",
      result:
        "The blocker was removed within an hour, and I was able to continue development. The database connection worked flawlessly from that point forward.\n\nWhat I learned: This challenge reinforced the importance of systematic investigation. It's easy to assume defaults, but real-world systems often deviate. By breaking the problem down, testing each component, and not jumping to conclusions, I can resolve issues faster and more reliably.\n\nI now apply this same structured approach to any technical challenge – whether it's debugging code, fixing infrastructure, or even team communication problems. This experience became my template for troubleshooting: verify assumptions first, form hypotheses, test methodically, and always document the solution for future reference.",
    },
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
    answer: {
      situation:
        "During my university capstone project, our team of six was building WaddleWait – a full-stack web application for restaurant waiters using React, Django, and PostgreSQL. In our first sprint, we committed to delivering a working prototype. I was responsible for the frontend, and a teammate handled the backend API.\n\nWe verbally agreed on API endpoints at sprint planning but didn't document them. Mid-sprint, the backend team made changes to the API – renaming fields and altering response structures – to optimise the database. They assumed I would notice, but they never communicated the changes. On the final day, integration failed, and we missed the deadline by three days.\n\nDuring the retrospective, several teammates placed most of the blame on me. They said I should have been more proactive in checking the API or asking for updates. I disagreed – I felt the real issue was a broken communication process, not just my individual oversight.",
      task: "I needed to respectfully disagree with my teammates without creating division or defensiveness. I wanted them to see that while I accepted partial responsibility, blaming one person wouldn't fix the underlying problem. My goal was to influence the team to adopt better communication practices so we wouldn't miss future deadlines.",
      action:
        "First, I acknowledged my part: 'You're right – I could have asked for updates more frequently. I'll own that.' This showed I wasn't trying to dodge accountability.\n\nThen I calmly explained my perspective: 'But I also didn't know the API had changed because we had no formal way of communicating those changes. If we rely on verbal agreements and hope people notice, this will keep happening to someone else.'\n\nInstead of just pointing out the problem, I came with solutions. I proposed:\n1. Daily 15-minute stand-ups so everyone shares what they're working on and any changes that might affect others.\n2. Pair programming sessions between frontend and backend members during API design.\n3. Shared API documentation (like a living Google Doc or Swagger) as the single source of truth.\n\nI framed it around the team's success: 'We all want to deliver a great project and stop missing deadlines. These changes will help us catch issues early and save us from last-minute firefights.' I asked if we could try the daily stand-ups for just one week and see if it helped.\n\nInitially, some teammates pushed back, saying it would add overhead or that we were 'too busy' for more meetings. I acknowledged their concern but suggested we experiment for a short period – if it didn't work, we could adjust. I also offered to facilitate the first few stand-ups to make it easier. The team agreed to give it a try.",
      result:
        "The daily stand-ups immediately improved visibility. We caught potential issues early because people spoke up. The pair programming sessions meant frontend and backend were aligned before writing code. We also started documenting endpoints in a shared doc.\n\nThe result? We never missed another deadline. Our second sprint delivered on time, and integration became smooth. A few weeks later, the same teammates who had blamed me admitted that the new processes made the project less stressful and more enjoyable.\n\nPersonally, I learned that disagreement isn't about winning – it's about listening, taking accountability for your part, and focusing on solutions that help the whole team. I also learned that influencing peers requires respect, evidence, and a willingness to compromise. Sometimes you have to absorb some blame to build trust, then use that trust to drive positive change.",
    },
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
    answer: {
      situation:
        "If I were starting at AWS as an Associate Systems Engineer, I'd approach my first six months with a clear progression: Learn, Contribute, and Own. Each phase builds on the previous one, with the ultimate goal of becoming a trusted, autonomous contributor to the team.",
      task: "My task would be to ramp up effectively in a complex environment, build credibility with the team, and deliver tangible value while adhering to Amazon's Leadership Principles. I'd need to balance learning with contributing, and move from being a new hire who needs guidance to an engineer who can independently own systems and mentor others.",
      action:
        "Phase 1: Learn (Months 1–2)\nIn the first two months, my primary goal would be to learn and absorb as much as possible. I'd focus on:\n1. Understanding the systems – Getting familiar with the AWS Region Services infrastructure, the tools the team uses daily (like Linux, networking tools, and monitoring systems), and how services interact.\n2. Learning the operational processes – Understanding how the team handles on-call rotations, incident response, and change management. I'd shadow senior engineers during troubleshooting to see how they dive deep into issues.\n3. Building relationships – Meeting teammates, learning their areas of expertise, and understanding how the team collaborates. I'd also set up regular 1:1s with my manager to ensure I'm aligned on expectations.\n\nBy the end of this phase, I'd want to be comfortable navigating the codebase, running basic troubleshooting independently, and knowing who to ask for help when I'm stuck.\n\nPhase 2: Contribute (Months 3–4)\nIn months three and four, I'd aim to start contributing independently while still leaning on the team for guidance. Specifically:\n1. Taking on small operational tasks – Resolving low-complexity tickets, writing or updating documentation, and automating manual processes I've identified during my learning phase. For example, if I notice a repeated troubleshooting step, I'd write a script to automate it – similar to how I built automation scripts in my LifeThon project.\n2. Participating in on-call rotations – I'd want to be ready to take on-call shifts with supervision, learning how to handle real incidents while following the team's best practices.\n3. Contributing to team discussions – Sharing observations from my work, asking thoughtful questions during design reviews, and gradually building the confidence to suggest improvements.\n\nBy the end of this phase, I'd want to be seen as a reliable team member who can handle routine issues without hand-holding.\n\nPhase 3: Own (Months 5–6)\nBy months five and six, my goal would be to take ownership of a specific area or service. This means:\n1. Owning a small service or component – Becoming the go-to person for at least one part of the system, understanding its architecture, common failure modes, and how to improve its operational health.\n2. Driving a small improvement project – Identifying a pain point in the team's workflow or a service and leading an effort to fix it. For example, improving monitoring alerts to reduce noise, or writing a tool that helps the team troubleshoot faster.\n3. Mentoring new team members – If the team grows, I'd want to be in a position to help newer engineers ramp up, just as I was helped in my first months.",
      result:
        "By the end of six months, I'd hope to have delivered at least one meaningful improvement, earned the team's trust, and be fully contributing as an owner of our services.\n\nUnderpinning all of this is Amazon's Leadership Principles. I'd approach every day with Customer Obsession – remembering that the systems I support impact real AWS customers. I'd Dive Deep when troubleshooting, not just fixing symptoms but understanding root causes. And I'd Insist on the Highest Standards by documenting my work, automating repetitive tasks, and continuously looking for ways to improve.\n\nUltimately, I want to be someone my teammates can rely on, my manager trusts, and our customers benefit from – even if indirectly through the stability and reliability of the services we operate.",
    },
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
  const [showFullAnswer, setShowFullAnswer] = useState(false);
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
    setShowFullAnswer(false);
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setShowTips(false);
    setShowFullAnswer(false);
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
              // Back of card - Tips or Full Answer
              <div className="flex flex-col h-full rotate-y-180">
                {!showFullAnswer ? (
                  // Tips View
                  <>
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

                      {currentCard.answer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFullAnswer(true);
                          }}
                          className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold w-full"
                        >
                          📖 View Sample Answer (STAR Format)
                        </button>
                      )}
                    </div>

                    <div className="absolute bottom-6 text-gray-400 text-sm">
                      Practice your answer out loud!
                    </div>
                  </>
                ) : (
                  // Full Answer View (STAR Format)
                  <div className="overflow-y-auto max-h-[500px] pr-2">
                    <div className="absolute top-6 right-6 flex gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        Sample Answer
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFullAnswer(false);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-sm mb-4"
                    >
                      ← Back to Tips
                    </button>

                    <h3 className="text-2xl font-bold text-gray-800 mb-6">
                      Sample STAR Answer
                    </h3>

                    {currentCard.answer && (
                      <div className="space-y-6">
                        {/* Situation */}
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                              S
                            </span>
                            Situation
                          </h4>
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {currentCard.answer.situation}
                          </p>
                        </div>

                        {/* Task */}
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                          <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                            <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                              T
                            </span>
                            Task
                          </h4>
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {currentCard.answer.task}
                          </p>
                        </div>

                        {/* Action */}
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                          <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                            <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                              A
                            </span>
                            Action
                          </h4>
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {currentCard.answer.action}
                          </p>
                        </div>

                        {/* Result */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                          <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                            <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                              R
                            </span>
                            Result
                          </h4>
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {currentCard.answer.result}
                          </p>
                        </div>

                        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded">
                          <p className="text-sm text-indigo-800">
                            💡 <strong>Pro Tip:</strong> Adapt this structure to
                            your own experiences. Keep answers to 2-3 minutes
                            and practice delivering them naturally!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
