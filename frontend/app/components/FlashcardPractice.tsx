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
  {
    id: 27,
    question: "Tell me about a time you solved a complex problem on your team.",
    category: "Problem Solving",
    tips: "Focus on your systematic approach: research, stakeholder engagement, root cause analysis. Show both technical fix and process improvement.",
    answer: {
      situation:
        "During my university capstone project, WaddleWait, our team of six was building a full-stack waiter management system using React, Django, and PostgreSQL. In our first sprint, we committed to delivering a working prototype with authentication and table management.\n\nOn the final day, when I tried to integrate my frontend with the backend, the application crashed completely. The API responses didn't match what my frontend expected – fields were renamed, data structures had changed, and nothing worked. We were facing a missed deadline and team tension was high.",
      task: "I needed to not only fix the immediate integration problem but also understand why it happened and prevent it from recurring. My task was to diagnose the root cause, fix the technical issue, engage stakeholders appropriately, and propose a long-term solution that would keep the team aligned.",
      action:
        "I didn't just assume it was someone else's mistake. First, I used browser developer tools to inspect the actual API responses coming from the backend. I compared them to the API specification we'd verbally agreed on and documented the differences line by line. I also checked the backend codebase to understand what changes had been made and why.\n\nI called an immediate meeting with the backend developer who had made the changes. Instead of blaming, I asked open questions: 'I noticed the API responses are different now – can you walk me through what changed and why?' I also engaged our project supervisor to get advice on how we should handle API design going forward.\n\nAfter understanding the changes, I updated my frontend code to match the new API format – that got us working again in the short term. But I knew the real problem was deeper. I proposed three solutions to the team:\n1. Daily 15-minute stand-ups so everyone shares what they're working on\n2. Pair programming sessions during API design so frontend and backend align early\n3. Shared API documentation (we started using a living Google Doc) as the single source of truth",
      result:
        "We never missed another deadline. Our second sprint delivered on time, and integration became smooth. The team adopted these practices, and a few weeks later, teammates admitted the changes made the project less stressful.\n\nI learned that complex technical problems often have human root causes – and fixing the process is sometimes more important than fixing the code. This experience taught me to dive deep into both technical and organizational aspects when solving problems.",
    },
  },
  {
    id: 28,
    question: "Tell me about a time you had to deal with a difficult customer.",
    category: "Customer Obsession",
    tips: "Show empathy and listening skills. Demonstrate how you identified the root cause of 'difficult' behavior and adapted your approach. Focus on understanding customer needs.",
    answer: {
      situation:
        "During my time as a mathematics tutor at Prof Education, I worked with a Year 11 student preparing for a trigonometry test. From our first session, she was resistant – she'd sigh heavily when I explained concepts, rush through practice questions without care, and often said things like 'I'm just not good at maths.' It would have been easy to label her as difficult and just go through the motions.",
      task: "My task was to help her prepare for the trigonometry test, but I quickly realized the deeper challenge was to understand why she was being resistant and find a way to engage her effectively. I needed to build trust and help her succeed despite her apparent lack of motivation.",
      action:
        "Instead of pushing harder, I paused and asked different questions. I said, 'I notice you seem really frustrated with trig – can you tell me more about that?' She opened up and explained that she'd failed a previous maths test and was convinced the same would happen again. She wasn't being difficult; she was scared of failing and didn't want to get her hopes up.\n\nI adjusted my approach completely. Instead of focusing on right and wrong answers, I focused on building understanding step by step. I created visual aids showing how trigonometry works with real triangles, used analogies she could relate to, and celebrated small wins – like when she correctly identified which ratio to use without prompting.\n\nI also gave her control. I asked, 'What part of trig feels most confusing to you? Let's start there.' By letting her guide the sessions, she became more invested.",
      result:
        "She passed her trigonometry test, but more importantly, her attitude transformed. She started arriving to sessions on time, asking questions proactively, and even laughing when she made mistakes instead of getting frustrated. Her parents later thanked me, saying they'd noticed how much more confident she'd become about maths.\n\nI learned that 'difficult' behavior is often a symptom of something deeper. In this case, it was fear of failure. By showing empathy, adjusting my approach, and building trust, I turned a challenging relationship into a productive one. That experience taught me that customer-centricity – whether with students or in any professional setting – starts with listening and understanding the person behind the problem.",
    },
  },
  {
    id: 28,
    question: "What is traceroute and when have you used it?",
    category: "Networking",
    tips: "Explain what it does, show command syntax, give real example from your experience.",
    answer: {
      situation:
        "Traceroute is a network diagnostic tool that shows the path packets take from your computer to a destination server, displaying each hop (router) along the way and the time it takes.",
      task: "It's used to diagnose network connectivity issues, identify where packets are being dropped or delayed, and understand network topology.",
      action:
        "Command: `traceroute amazon.com` or `tracert amazon.com` (Windows)\n\nIt works by sending packets with incrementing TTL (Time To Live) values:\n1. First packet: TTL=1, first router responds\n2. Second packet: TTL=2, second router responds\n3. Continues until destination is reached\n\nI used it when setting up LifeThon's AWS deployment. My EC2 instance couldn't reach the RDS database. I ran `traceroute <rds-endpoint>` and noticed packets were timing out at a specific router, which led me to discover a misconfigured security group that was blocking traffic.",
      result:
        "Traceroute helped me identify the exact network hop where connectivity failed, narrowing down the problem from 'database unreachable' to 'security group blocking traffic at the VPC level.' This saved hours of random troubleshooting.",
    },
  },
  {
    id: 33,
    question: "What are the fields in /etc/passwd?",
    category: "Linux",
    tips: "List all 7 fields in order, explain what each does. Memorize this - it's a classic interview question.",
    answer: {
      situation:
        "The /etc/passwd file stores user account information on Linux systems. Each line represents one user with 7 colon-separated fields.",
      task: "Understanding this file is essential for user management, troubleshooting login issues, and system administration.",
      action:
        "The 7 fields in order:\n1. **Username** - Login name (e.g., 'ubuntu', 'root')\n2. **Password** - Usually 'x' (actual password in /etc/shadow)\n3. **UID** - User ID number (0 = root, 1000+ = regular users)\n4. **GID** - Primary group ID\n5. **GECOS** - User info (full name, phone, etc.)\n6. **Home directory** - User's home folder (e.g., /home/ubuntu)\n7. **Shell** - Login shell (e.g., /bin/bash, /bin/sh)\n\nExample line:\n`ubuntu:x:1000:1000:Ubuntu User:/home/ubuntu:/bin/bash`\n\nI use this when troubleshooting: `cat /etc/passwd | grep ubuntu` to verify user configuration, check if accounts exist, or debug permission issues in LifeThon deployments.",
      result:
        "Understanding /etc/passwd helps quickly diagnose user-related issues like wrong shell, missing home directory, or incorrect UID/GID causing permission problems.",
    },
  },

  {
    id: 30,
    question: "What's the difference between TCP and UDP?",
    category: "Networking",
    tips: "Know the key differences, when to use each, and give examples from your project.",
    answer: {
      situation:
        "TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are two core transport layer protocols in networking.",
      task: "Choose the right protocol based on whether you need reliability or speed.",
      action:
        "**TCP (Transmission Control Protocol):**\n- Connection-oriented (3-way handshake)\n- Reliable: guarantees delivery, order, error checking\n- Slower due to overhead\n- Use for: HTTP/HTTPS, email, file transfer, databases\n- Example: My LifeThon backend uses TCP for PostgreSQL connections - we need guaranteed delivery of queries\n\n**UDP (User Datagram Protocol):**\n- Connectionless (fire and forget)\n- Unreliable: no delivery guarantee, packets may arrive out of order\n- Faster, lower overhead\n- Use for: Video streaming, DNS, gaming, VoIP\n- Example: DNS lookups use UDP because speed matters more than 100% reliability\n\n**TCP/IP:**\nTCP/IP refers to the entire Internet protocol suite, not just TCP. It includes:\n- Application Layer (HTTP, FTP, SMTP)\n- Transport Layer (TCP, UDP)\n- Internet Layer (IP)\n- Link Layer (Ethernet, WiFi)",
      result:
        "In LifeThon, I use TCP for all API requests and database connections because data integrity is critical for authentication and gacha pulls. If I were building real-time leaderboards, I might consider UDP for lower latency.",
    },
  },

  {
    id: 31,
    question:
      "What happens when you type https://www.amazon.com into your browser?",
    category: "Networking",
    tips: "Walk through each step from DNS to rendering. Show breadth of knowledge across network stack.",
    answer: {
      situation:
        "This question tests understanding of the full web request lifecycle from DNS to rendering.",
      task: "Explain the complete journey of a web request through multiple layers of networking, security, and application protocols.",
      action:
        "**Step-by-step breakdown:**\n\n1. **DNS Lookup:**\n   - Browser checks cache (browser → OS → router → ISP)\n   - If not cached, queries DNS resolver\n   - DNS returns IP address (e.g., 205.251.242.103)\n\n2. **TCP Connection:**\n   - Browser initiates TCP 3-way handshake with server\n   - SYN → SYN-ACK → ACK\n\n3. **TLS/SSL Handshake (HTTPS):**\n   - Client Hello (supported cipher suites)\n   - Server Hello (chosen cipher, certificate)\n   - Certificate verification\n   - Key exchange, encrypted connection established\n\n4. **HTTP Request:**\n   - Browser sends: `GET / HTTP/1.1\\nHost: www.amazon.com`\n   - Includes headers (cookies, user-agent, etc.)\n\n5. **Server Processing:**\n   - Request hits load balancer\n   - Routes to application server\n   - Server processes request, queries database\n   - Generates HTML response\n\n6. **HTTP Response:**\n   - Server sends HTML, CSS, JavaScript\n   - Status code (200 OK)\n\n7. **Rendering:**\n   - Browser parses HTML, builds DOM\n   - Fetches additional resources (images, CSS, JS)\n   - Executes JavaScript\n   - Renders page\n\nIn my LifeThon project, I see this same flow: DNS → Load Balancer → EC2 Backend → RDS Database → Response → React Frontend rendering.",
      result:
        "Understanding this flow helps debug issues at every layer: DNS problems, SSL certificate errors, slow queries, rendering issues. When LifeThon's frontend couldn't reach the backend, I traced through this flow to find the security group was blocking HTTPS traffic.",
    },
  },

  {
    id: 32,
    question: "How do you check background processes on Linux?",
    category: "Linux",
    tips: "Give multiple commands with examples. Show you know ps, top, jobs, and when to use each.",
    answer: {
      situation:
        "Linux provides several tools to monitor and manage background processes.",
      task: "Know which tool to use for different scenarios: one-time check, real-time monitoring, or job control.",
      action:
        "**Primary Commands:**\n\n1. **ps aux** - Snapshot of all processes\n   ```bash\n   ps aux | grep java  # Find specific process\n   ps aux --sort=-%cpu | head  # Top CPU users\n   ```\n\n2. **top / htop** - Real-time interactive monitoring\n   ```bash\n   top -u ubuntu  # Filter by user\n   htop  # Better UI, easier to use\n   ```\n\n3. **jobs** - Current shell's background jobs\n   ```bash\n   jobs  # List background jobs\n   fg %1  # Bring job 1 to foreground\n   bg %1  # Resume job 1 in background\n   ```\n\n4. **pgrep / pidof** - Find process IDs\n   ```bash\n   pgrep java  # Get PID of java processes\n   pidof postgres  # Get PID of postgres\n   ```\n\n5. **systemctl** - For services\n   ```bash\n   systemctl status postgresql\n   systemctl list-units --type=service\n   ```\n\n**Real example from LifeThon:**\nWhen my backend was using too much memory, I ran:\n```bash\nps aux --sort=-%mem | head -10\n```\nFound the Java process, checked details with `top -p <PID>`, discovered a memory leak in the gacha pull logic.",
      result:
        "Knowing which command to use saves time: ps for quick checks, top for real-time monitoring, jobs for shell management, systemctl for services.",
    },
  },
  {
    id: 33,
    question:
      "Tell me about a time you made a short-term sacrifice for long-term gain.",
    category: "Ownership",
    tips: "Show you think strategically, not just tactically. Explain the trade-off clearly and quantify the long-term benefit.",
    answer: {
      situation:
        "During my university capstone project, WaddleWait, our team of six was building a full-stack waiter management system using React, Django, and PostgreSQL. In our first sprint, we missed the deadline badly. The backend team had changed API endpoints without communicating with me on frontend, and on integration day, everything crashed. During the retrospective, there was tension and blame.\n\nI had a choice: focus solely on my own frontend work and hit my individual targets, or invest time in fixing the underlying team communication problems.",
      task: "The long-term goal was a successful project and a team that worked well together. But achieving that would require short-term effort that wasn't strictly 'my job' - I'd need to sacrifice my own coding velocity to build team processes.",
      action:
        "I made a conscious sacrifice of my own coding time to invest in team processes:\n\n1. Facilitated honest retrospective - Acknowledged my part first: 'I could have asked for updates more frequently.' This lowered tension and opened real conversation.\n\n2. Proposed and implemented new processes - Advocated for daily 15-minute stand-ups, pair programming sessions during API design, and shared API documentation. This took significant time to set up and coordinate, especially when teammates were initially resistant.\n\n3. Created first documentation template - Spent an evening building a Google Doc structure for API endpoints with examples and expected responses. Time I could have spent on frontend features.\n\n4. Facilitated first week of stand-ups - Showed up early, kept meetings focused, modeled how to share updates effectively. Extra effort on top of regular workload.\n\nThe short-term sacrifice: For about two weeks, I made less progress on my individual frontend tasks because I was investing time in team coordination, documentation, and process building. I fell slightly behind my personal timeline.",
      result:
        "The investment paid off immediately and continuously:\n\n- Never missed another deadline - second sprint delivered on time, and every sprint after\n- Integration became smooth - frontend and backend aligned before code was written\n- Team morale improved significantly - people felt heard and respected\n- Teammates who initially pushed back later admitted the new processes made the project less stressful and more enjoyable\n- Delivered a working product that actual restaurant staff found useful\n\nWhat I learned: Sometimes the best contribution isn't writing more code - it's fixing the systems that enable everyone to write better code. The short-term hit to my individual productivity was absolutely worth it for the team's long-term success. I'll carry this lesson into any role: invest in processes early, even when it's not the obvious choice, because it pays dividends.",
    },
  },

  {
    id: 34,
    question: "Tell me about a time you made a mistake.",
    category: "Learning & Growth",
    tips: "Own the mistake fully, explain what you learned, and show how you've changed your approach since.",
    answer: {
      situation:
        "Early in my LifeThon project, I was setting up the Spring Boot backend with PostgreSQL. I'd done this before in university, so I felt confident. I configured my application.properties with the standard JDBC URL: jdbc:postgresql://localhost:5432/LifeThon. When I ran the application, I got a 'connection refused' error.",
      task: "I needed to resolve the connectivity issue to continue development. But more importantly, I needed to learn from this mistake so I wouldn't repeat it - not just fix this one instance, but change my troubleshooting approach permanently.",
      action:
        "The mistake: I assumed the problem was with my code or the PostgreSQL service itself, not my configuration. I spent hours checking:\n- Is PostgreSQL installed correctly? (Yes)\n- Is the service running? (Yes - systemctl status postgresql showed active)\n- Are my credentials correct? (Yes - I could connect via psql)\n- Is there a firewall blocking it? (No)\n\nI was so convinced the problem was somewhere else that I never questioned my core assumption: that PostgreSQL was actually running on port 5432. I'd installed it months ago and never verified the port. I just assumed it was default.\n\nAfter hours of frustration, I finally stepped back and questioned my assumptions:\n1. Ran netstat -ano | findstr :5432 - nothing listening\n2. Ran netstat -ano | findstr :8080 - something was listening\n3. Checked postgresql.conf - sure enough, port = 8080\n\nThe database had been configured to port 8080 during installation to avoid conflicts. I'd never checked.\n\nI updated application.properties to jdbc:postgresql://localhost:8080/LifeThon and it worked immediately.\n\nBut I didn't stop there:\n- Documented the actual port in my project diary\n- Added to troubleshooting checklist: 'Always verify actual configuration - don't assume defaults'\n- Shared with peers working on similar projects to help them avoid the same mistake",
      result:
        "Immediate problem solved within minutes once I questioned my assumption. But the bigger outcome was a permanent change in how I approach troubleshooting.\n\nNow, whenever I encounter a connection error, my first questions are: 'What are the actual ports? What's the actual configuration? What am I assuming that might be wrong?'\n\nWhat I learned: Experience can sometimes work against you - you start assuming things are 'obvious' or 'default'. The most valuable troubleshooting skill isn't knowing all the answers - it's knowing how to question your own assumptions systematically. This became my diagnostic script approach: verify everything, assume nothing.\n\nI've applied this lesson to every technical challenge since: JWT implementation, OAuth integration, AWS deployment. The PostgreSQL mistake was costly in time, but invaluable in teaching me systematic investigation over assumption-based debugging.",
    },
  },

  {
    id: 35,
    question:
      "Tell me about a time you disagreed with someone and how you resolved it.",
    category: "Conflict Resolution",
    tips: "Show you can disagree professionally, listen to others, and focus on solutions rather than winning arguments.",
    answer: {
      situation:
        "During my university capstone project, I was part of a six-person team building WaddleWait - a full-stack waiter management system using React, Django, and PostgreSQL. In our first sprint, we missed the deadline badly. I was responsible for the frontend and hadn't completed all my tasks. During the retrospective, one teammate placed the blame entirely on me.",
      task: "I knew I had some responsibility - I could have been more proactive. But I also believed the real problem was deeper than one person's performance. My task was to acknowledge my part while helping the team see that our processes were broken. I needed to resolve the conflict without getting defensive and prevent it from happening again.",
      action:
        "First, I owned my mistake openly: 'You're right - I didn't complete everything. I'll take responsibility for that.' That immediately lowered the tension and showed I wasn't trying to dodge accountability.\n\nThen I explained my perspective calmly: 'But part of why I was blocked was that I was waiting on APIs that weren't ready, and when they arrived, the inconsistent naming conventions (mixing snake_case and camelCase) made integration confusing. This isn't about blame - it's about a system that failed us.'\n\nInstead of just pointing out problems, I proposed solutions:\n1. Daily 15-minute standups so everyone shares progress and blockers\n2. Shared API documentation with consistent camelCase naming\n3. Using mock data so frontend could build without waiting for complete backend\n\nI also admitted what I could have done differently: 'I should have built around the delay with mock data instead of waiting passively. That's on me, and I'll handle blocking dependencies better next time.'",
      result:
        "The team agreed to try my suggestions. The standups immediately improved visibility - we caught issues early before they became blockers. The API docs eliminated naming confusion and integration bugs. By owning my part first, I built trust with the teammate who had blamed me. She later thanked me for handling it constructively instead of getting defensive.\n\nWe never missed another deadline. Team morale improved significantly because communication was clearer and everyone felt heard. The conflict became a turning point that made us a stronger team.\n\nWhat I learned: Resolving conflict isn't about being right or winning the argument - it's about listening, owning your part first, and focusing on solutions that help everyone. Taking accountability disarms defensiveness and creates space for productive conversation. This approach has served me in every team situation since.",
    },
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
