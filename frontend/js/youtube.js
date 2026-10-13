/**
 * YouTube Learning Resources Logic
 * College CEP Project: CareerSetu
 * Curated Database of 100+ Free Educational Playlists & Courses
 */

const playlists = [
  // ========================================================
  // CATEGORY 1: Programming & Web Development (20 Playlists)
  // ========================================================
  {
    id: 1,
    title: "Python for Beginners (Full Course in Hindi)",
    category: "Programming & Web Development",
    channel: "CodeWithHarry",
    skills: ["Python", "Variables", "Loops", "OOP", "File Handling"],
    videos: "100 videos",
    views: "15M views",
    url: "https://www.youtube.com/playlist?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg",
    thumbnail: "https://img.youtube.com/vi/gfDE2a7MKjA/mqdefault.jpg"
  },
  {
    id: 2,
    title: "Python Programming Tutorial for Beginners",
    category: "Programming & Web Development",
    channel: "Programming with Mosh",
    skills: ["Python Basics", "Data Structures", "Functions", "Modules"],
    videos: "Full Course",
    views: "42M views",
    url: "https://www.youtube.com/results?search_query=programming+with+mosh+python+tutorial+for+beginners",
    thumbnail: "https://img.youtube.com/vi/_uQrJ0TkZlc/mqdefault.jpg"
  },
  {
    id: 3,
    title: "Complete Web Development Bootcamp (HTML, CSS, JS)",
    category: "Programming & Web Development",
    channel: "Apna College",
    skills: ["HTML5", "CSS3", "JavaScript", "Responsive Web Design"],
    videos: "85 videos",
    views: "9.5M views",
    url: "https://www.youtube.com/playlist?list=PLfqMhTWNBTe3H6c9OGXb5_6wccPrEcaQR",
    thumbnail: "https://img.youtube.com/vi/l1EssrLxtVM/mqdefault.jpg"
  },
  {
    id: 4,
    title: "Full Stack Web Development Course",
    category: "Programming & Web Development",
    channel: "freeCodeCamp.org",
    skills: ["Frontend", "Backend", "Full Stack", "Git", "Deployment"],
    videos: "Full Course",
    views: "3.8M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+full+stack+web+development+course",
    thumbnail: "https://img.youtube.com/vi/nu_pCVPKzTk/mqdefault.jpg"
  },
  {
    id: 5,
    title: "Complete JavaScript Tutorial (Hindi)",
    category: "Programming & Web Development",
    channel: "Chai aur Code",
    skills: ["JavaScript", "DOM", "Async/Await", "Promises", "ES6+"],
    videos: "51 videos",
    views: "3.2M views",
    url: "https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37",
    thumbnail: "https://img.youtube.com/vi/sscX432bMZo/mqdefault.jpg"
  },
  {
    id: 6,
    title: "JavaScript Full Course for Beginners",
    category: "Programming & Web Development",
    channel: "freeCodeCamp.org",
    skills: ["JS Syntax", "Arrays", "Objects", "Algorithms", "DOM"],
    videos: "Full Course",
    views: "18M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+javascript+full+course",
    thumbnail: "https://img.youtube.com/vi/PkZNo7MFNFg/mqdefault.jpg"
  },
  {
    id: 7,
    title: "React JS Complete Tutorial (Hindi)",
    category: "Programming & Web Development",
    channel: "Thapa Technical",
    skills: ["React", "Hooks", "Components", "State", "React Router"],
    videos: "72 videos",
    views: "4.8M views",
    url: "https://www.youtube.com/playlist?list=PLwGdqUZWnOp3aROg4wypcRhZqJG3ajZWJ",
    thumbnail: "https://img.youtube.com/vi/tiLWCNFz9QU/mqdefault.jpg"
  },
  {
    id: 8,
    title: "React.js Full Course 2024",
    category: "Programming & Web Development",
    channel: "freeCodeCamp.org",
    skills: ["React", "JSX", "Props", "Context API", "Redux Toolkit"],
    videos: "Full Course",
    views: "2.9M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+react+full+course",
    thumbnail: "https://img.youtube.com/vi/bMknfKXIFA8/mqdefault.jpg"
  },
  {
    id: 9,
    title: "Node.js & Express.js Full Course",
    category: "Programming & Web Development",
    channel: "Dave Gray",
    skills: ["Node.js", "Express", "REST APIs", "Middleware", "MongoDB"],
    videos: "15 videos",
    views: "1.4M views",
    url: "https://www.youtube.com/results?search_query=dave+gray+nodejs+express+tutorial",
    thumbnail: "https://img.youtube.com/vi/f2EqECiTBL8/mqdefault.jpg"
  },
  {
    id: 10,
    title: "Java Complete Placement Course",
    category: "Programming & Web Development",
    channel: "Apna College",
    skills: ["Java", "OOP", "Recursion", "Backtracking", "Collections"],
    videos: "42 videos",
    views: "11M views",
    url: "https://www.youtube.com/playlist?list=PLfqMhTWNBTe3GtNO37DPCaL5eODfP4rPn",
    thumbnail: "https://img.youtube.com/vi/yRpLlJmRo2w/mqdefault.jpg"
  },
  {
    id: 11,
    title: "C Language Full Course in Hindi",
    category: "Programming & Web Development",
    channel: "CodeWithHarry",
    skills: ["C Basics", "Pointers", "Memory Management", "Arrays", "Structures"],
    videos: "15 videos",
    views: "7.2M views",
    url: "https://www.youtube.com/playlist?list=PLu0W_9lII9aiXlHcLx-mDH1Qul38wD3aR",
    thumbnail: "https://img.youtube.com/vi/ZSPZob_1TOk/mqdefault.jpg"
  },
  {
    id: 12,
    title: "C++ Complete Placement Course",
    category: "Programming & Web Development",
    channel: "Love Babbar",
    skills: ["C++", "STL", "Object Oriented Programming", "Memory Management"],
    videos: "148 videos",
    views: "12M views",
    url: "https://www.youtube.com/playlist?list=PLDzeHZWIZsTryvtXdMr6rPh4IDexB5NIA",
    thumbnail: "https://img.youtube.com/vi/EAR7De6Goz4/mqdefault.jpg"
  },
  {
    id: 13,
    title: "Data Structures & Algorithms in Java",
    category: "Programming & Web Development",
    channel: "Kunal Kushwaha",
    skills: ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming"],
    videos: "65 videos",
    views: "6.5M views",
    url: "https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ",
    thumbnail: "https://img.youtube.com/vi/rZ41y93P2Qo/mqdefault.jpg"
  },
  {
    id: 14,
    title: "A-Z DSA Course (C++ & Java)",
    category: "Programming & Web Development",
    channel: "take U forward (Striver)",
    skills: ["DSA Sheet", "Sorting", "Binary Search", "Trees", "Graphs"],
    videos: "120 videos",
    views: "8.1M views",
    url: "https://www.youtube.com/playlist?list=PLgUwDviBIf0oF6QL8m22w1hIDC1vJ_BHz",
    thumbnail: "https://img.youtube.com/vi/0bHoB35fCgg/mqdefault.jpg"
  },
  {
    id: 15,
    title: "SQL and Relational Databases Tutorial",
    category: "Programming & Web Development",
    channel: "freeCodeCamp.org",
    skills: ["SQL", "Queries", "Joins", "PostgreSQL", "Database Design"],
    videos: "Full Course",
    views: "6.8M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+sql+database+course",
    thumbnail: "https://img.youtube.com/vi/HXV3zeQKqGY/mqdefault.jpg"
  },
  {
    id: 16,
    title: "Git and GitHub for Beginners",
    category: "Programming & Web Development",
    channel: "Kunal Kushwaha",
    skills: ["Git Commands", "Branching", "Merge Conflicts", "GitHub Workflows"],
    videos: "Full Course",
    views: "2.5M views",
    url: "https://www.youtube.com/results?search_query=kunal+kushwaha+git+github+tutorial",
    thumbnail: "https://img.youtube.com/vi/apGV9Kg7ics/mqdefault.jpg"
  },
  {
    id: 17,
    title: "Flutter App Development for Beginners",
    category: "Programming & Web Development",
    channel: "freeCodeCamp.org",
    skills: ["Flutter", "Dart", "Cross-Platform Mobile Apps", "State Management"],
    videos: "Full Course",
    views: "2.1M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+flutter+full+course",
    thumbnail: "https://img.youtube.com/vi/VPvVD8t02U8/mqdefault.jpg"
  },
  {
    id: 18,
    title: "Android Development with Kotlin",
    category: "Programming & Web Development",
    channel: "Philipp Lackner",
    skills: ["Kotlin", "Android Studio", "Jetpack Compose", "MVVM"],
    videos: "25 videos",
    views: "1.3M views",
    url: "https://www.youtube.com/results?search_query=philipp+lackner+android+development+course",
    thumbnail: "https://img.youtube.com/vi/fis26HvvDAE/mqdefault.jpg"
  },
  {
    id: 19,
    title: "Next.js Complete Course",
    category: "Programming & Web Development",
    channel: "CodeWithHarry",
    skills: ["Next.js", "Server Side Rendering", "API Routes", "Tailwind CSS"],
    videos: "35 videos",
    views: "1.9M views",
    url: "https://www.youtube.com/results?search_query=codewithharry+nextjs+full+course",
    thumbnail: "https://img.youtube.com/vi/DZko_n2_XyQ/mqdefault.jpg"
  },
  {
    id: 20,
    title: "Tailwind CSS Full Tutorial",
    category: "Programming & Web Development",
    channel: "The Net Ninja",
    skills: ["Tailwind CSS", "Utility Classes", "Flexbox", "Grid", "Responsive UI"],
    videos: "16 videos",
    views: "1.1M views",
    url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9gpXORlEHjc5bgnIi5HEGhw",
    thumbnail: "https://img.youtube.com/vi/bxmDnn7NY4c/mqdefault.jpg"
  },

  // ========================================================
  // CATEGORY 2: Computer Fundamentals & IT (15 Playlists)
  // ========================================================
  {
    id: 21,
    title: "Computer Fundamentals Complete Course",
    category: "Computer Fundamentals & IT",
    channel: "Gate Smashers",
    skills: ["Computer Basics", "Hardware", "CPU", "Memory Hierarchy", "I/O Systems"],
    videos: "45 videos",
    views: "3.8M views",
    url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiFM9AUF5ZkX_4rV31X3K1eR",
    thumbnail: "https://img.youtube.com/vi/1n8Xw9h8n8g/mqdefault.jpg"
  },
  {
    id: 22,
    title: "Operating Systems Complete Playlist",
    category: "Computer Fundamentals & IT",
    channel: "Gate Smashers",
    skills: ["Process Management", "CPU Scheduling", "Deadlocks", "Virtual Memory"],
    videos: "88 videos",
    views: "14M views",
    url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGz9donHRrE9I3Mwn6XdP8p",
    thumbnail: "https://img.youtube.com/vi/bkSWJJZNgf8/mqdefault.jpg"
  },
  {
    id: 23,
    title: "Computer Networks Complete Course",
    category: "Computer Fundamentals & IT",
    channel: "Gate Smashers",
    skills: ["OSI Model", "TCP/IP", "Routing Protocols", "Subnetting", "DNS"],
    videos: "115 videos",
    views: "12M views",
    url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_",
    thumbnail: "https://img.youtube.com/vi/VwN91x5iWiQ/mqdefault.jpg"
  },
  {
    id: 24,
    title: "Database Management Systems (DBMS)",
    category: "Computer Fundamentals & IT",
    channel: "Knowledge Gate",
    skills: ["DBMS Architecture", "ER Models", "Normalization", "SQL Transactions"],
    videos: "70 videos",
    views: "5.4M views",
    url: "https://www.youtube.com/playlist?list=PLmXKhU93_WZQ1QG7pZ5Xo_L9s6gqU5_T6",
    thumbnail: "https://img.youtube.com/vi/3EJlovevfcA/mqdefault.jpg"
  },
  {
    id: 25,
    title: "Computer Organization and Architecture (COA)",
    category: "Computer Fundamentals & IT",
    channel: "Gate Smashers",
    skills: ["Instruction Cycle", "Pipelining", "Cache Memory", "Addressing Modes"],
    videos: "68 videos",
    views: "7.1M views",
    url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiHMonh3G6QNKq53C6oNXGrX",
    thumbnail: "https://img.youtube.com/vi/L9X7XXfHYdU/mqdefault.jpg"
  },
  {
    id: 26,
    title: "Linux for Beginners Course",
    category: "Computer Fundamentals & IT",
    channel: "NetworkChuck",
    skills: ["Linux CLI", "File Systems", "Permissions", "Bash Scripting", "SSH"],
    videos: "15 videos",
    views: "4.2M views",
    url: "https://www.youtube.com/results?search_query=networkchuck+linux+for+beginners+course",
    thumbnail: "https://img.youtube.com/vi/sWbUDq4S6Y8/mqdefault.jpg"
  },
  {
    id: 27,
    title: "Google IT Support Professional Certificate",
    category: "Computer Fundamentals & IT",
    channel: "Google Career Certificates",
    skills: ["Technical Support", "Troubleshooting", "System Admin", "Security"],
    videos: "Course Overview",
    views: "2.7M views",
    url: "https://www.youtube.com/results?search_query=google+it+support+professional+certificate+course",
    thumbnail: "https://img.youtube.com/vi/2sK1c7jW3p8/mqdefault.jpg"
  },
  {
    id: 28,
    title: "CompTIA A+ Core 1 Certification Course",
    category: "Computer Fundamentals & IT",
    channel: "Professor Messer",
    skills: ["Hardware", "Networking", "Mobile Devices", "Virtualization", "Cloud"],
    videos: "65 videos",
    views: "3.5M views",
    url: "https://www.youtube.com/playlist?list=PLG49S3nxzAnlGHY8ObL8Dqq_DJ-5k0mvi",
    thumbnail: "https://img.youtube.com/vi/lS9k5m0y0Z4/mqdefault.jpg"
  },
  {
    id: 29,
    title: "Digital Electronics & Logic Design",
    category: "Computer Fundamentals & IT",
    channel: "Neso Academy",
    skills: ["Binary Numbers", "Logic Gates", "Boolean Algebra", "Flip-Flops", "Counters"],
    videos: "140 videos",
    views: "18M views",
    url: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm",
    thumbnail: "https://img.youtube.com/vi/M0mx8S05v60/mqdefault.jpg"
  },
  {
    id: 30,
    title: "Cloud Computing Fundamentals (AWS & Azure)",
    category: "Computer Fundamentals & IT",
    channel: "edureka!",
    skills: ["Cloud Models", "AWS EC2", "S3 Storage", "IAM Roles", "Serverless"],
    videos: "Full Course",
    views: "1.9M views",
    url: "https://www.youtube.com/results?search_query=edureka+cloud+computing+full+course",
    thumbnail: "https://img.youtube.com/vi/M988_bvS2nM/mqdefault.jpg"
  },
  {
    id: 31,
    title: "Excel, Word & PowerPoint Complete Tutorial",
    category: "Computer Fundamentals & IT",
    channel: "Kevin Stratvert",
    skills: ["Microsoft Word", "Excel Formulas", "PowerPoint Slides", "Office 365"],
    videos: "12 videos",
    views: "5.1M views",
    url: "https://www.youtube.com/results?search_query=kevin+stratvert+excel+word+powerpoint+tutorial",
    thumbnail: "https://img.youtube.com/vi/Vl0H-qTclOg/mqdefault.jpg"
  },
  {
    id: 32,
    title: "Advanced Excel for Careers and Business",
    category: "Computer Fundamentals & IT",
    channel: "Chandoo / LearnoVita",
    skills: ["VLOOKUP", "XLOOKUP", "Pivot Tables", "Macros", "Dashboards"],
    videos: "22 videos",
    views: "2.4M views",
    url: "https://www.youtube.com/results?search_query=chandoo+advanced+excel+full+course",
    thumbnail: "https://img.youtube.com/vi/rwbho0CgEAE/mqdefault.jpg"
  },
  {
    id: 33,
    title: "How the Internet Works & Web Architecture",
    category: "Computer Fundamentals & IT",
    channel: "CS50",
    skills: ["IP Addresses", "Routers", "HTTP/HTTPS", "Packets", "Bandwidth"],
    videos: "Lecture Series",
    views: "3.0M views",
    url: "https://www.youtube.com/results?search_query=cs50+how+the+internet+works",
    thumbnail: "https://img.youtube.com/vi/7_LPdttKXPc/mqdefault.jpg"
  },
  {
    id: 34,
    title: "Software Engineering & SDLC Models",
    category: "Computer Fundamentals & IT",
    channel: "Gate Smashers",
    skills: ["Agile Methodology", "Waterfall Model", "Testing", "UML Diagrams"],
    videos: "50 videos",
    views: "4.1M views",
    url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiEed7SKZBnC6ypFDWYLRvB2",
    thumbnail: "https://img.youtube.com/vi/Wxab_s3n3iA/mqdefault.jpg"
  },
  {
    id: 35,
    title: "Discrete Mathematics for Computer Science",
    category: "Computer Fundamentals & IT",
    channel: "Neso Academy",
    skills: ["Set Theory", "Relations & Functions", "Graph Theory", "Combinatorics"],
    videos: "120 videos",
    views: "7.9M views",
    url: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRhqJPDXcvYlLfXPh37L89g3",
    thumbnail: "https://img.youtube.com/vi/wGLTV8Mtll8/mqdefault.jpg"
  },

  // ========================================================
  // CATEGORY 3: AI, Data Science & Cybersecurity (15 Playlists)
  // ========================================================
  {
    id: 36,
    title: "Machine Learning Full Course for Beginners",
    category: "AI, Data Science & Cybersecurity",
    channel: "freeCodeCamp.org",
    skills: ["Linear Regression", "Classification", "Scikit-Learn", "Model Evaluation"],
    videos: "Full Course",
    views: "4.5M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+machine+learning+course",
    thumbnail: "https://img.youtube.com/vi/i_LwzRVP7bg/mqdefault.jpg"
  },
  {
    id: 37,
    title: "Neural Networks & Deep Learning Visualized",
    category: "AI, Data Science & Cybersecurity",
    channel: "3Blue1Brown",
    skills: ["Neural Networks", "Gradient Descent", "Backpropagation", "Deep Learning"],
    videos: "4 videos",
    views: "18M views",
    url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi",
    thumbnail: "https://img.youtube.com/vi/aircAruvnKk/mqdefault.jpg"
  },
  {
    id: 38,
    title: "Artificial Intelligence Full Course",
    category: "AI, Data Science & Cybersecurity",
    channel: "Simplilearn",
    skills: ["AI Concepts", "Supervised Learning", "Search Algorithms", "Ethics in AI"],
    videos: "Full Course",
    views: "3.1M views",
    url: "https://www.youtube.com/results?search_query=simplilearn+artificial+intelligence+full+course",
    thumbnail: "https://img.youtube.com/vi/JMUxmLyrhSk/mqdefault.jpg"
  },
  {
    id: 39,
    title: "Data Science with Python in Hindi",
    category: "AI, Data Science & Cybersecurity",
    channel: "CodeWithHarry",
    skills: ["NumPy", "Pandas", "Matplotlib", "Seaborn", "Data Cleaning"],
    videos: "25 videos",
    views: "3.2M views",
    url: "https://www.youtube.com/results?search_query=codewithharry+data+science+python+course",
    thumbnail: "https://img.youtube.com/vi/RBSGKlAnoiM/mqdefault.jpg"
  },
  {
    id: 40,
    title: "Power BI Full Course for Beginners",
    category: "AI, Data Science & Cybersecurity",
    channel: "edureka!",
    skills: ["Power BI Desktop", "DAX Formulas", "Data Modeling", "Reports & Dashboards"],
    videos: "Full Course",
    views: "2.8M views",
    url: "https://www.youtube.com/results?search_query=edureka+power+bi+full+course",
    thumbnail: "https://img.youtube.com/vi/3u7MQz1EyPY/mqdefault.jpg"
  },
  {
    id: 41,
    title: "Tableau Complete Course for Beginners",
    category: "AI, Data Science & Cybersecurity",
    channel: "Simplilearn",
    skills: ["Tableau Desktop", "Visual Analytics", "Calculated Fields", "Storyboards"],
    videos: "Full Course",
    views: "1.6M views",
    url: "https://www.youtube.com/results?search_query=simplilearn+tableau+tutorial+full+course",
    thumbnail: "https://img.youtube.com/vi/aHaOIvR00So/mqdefault.jpg"
  },
  {
    id: 42,
    title: "Data Analysis with Pandas and Python",
    category: "AI, Data Science & Cybersecurity",
    channel: "Keith Galli",
    skills: ["Pandas DataFrames", "Data Wrangling", "Filtering", "Aggregations"],
    videos: "Full Course",
    views: "1.9M views",
    url: "https://www.youtube.com/results?search_query=keith+galli+pandas+data+analysis",
    thumbnail: "https://img.youtube.com/vi/vmEHCJofslg/mqdefault.jpg"
  },
  {
    id: 43,
    title: "Cyber Security Full Course for Beginners",
    category: "AI, Data Science & Cybersecurity",
    channel: "edureka!",
    skills: ["Cybersecurity Basics", "Threat Analysis", "Cryptography", "Network Security"],
    videos: "Full Course",
    views: "4.6M views",
    url: "https://www.youtube.com/results?search_query=edureka+cyber+security+full+course",
    thumbnail: "https://img.youtube.com/vi/nzZkKoREEGo/mqdefault.jpg"
  },
  {
    id: 44,
    title: "Ethical Hacking Full Course (Hindi)",
    category: "AI, Data Science & Cybersecurity",
    channel: "Technical Sagar",
    skills: ["Reconnaissance", "Vulnerability Scanning", "WiFi Security", "Social Engineering"],
    videos: "30 videos",
    views: "5.2M views",
    url: "https://www.youtube.com/results?search_query=ethical+hacking+full+course+hindi",
    thumbnail: "https://img.youtube.com/vi/xlkxXnJvK3o/mqdefault.jpg"
  },
  {
    id: 45,
    title: "Hands-on Network Security & Penetration Testing",
    category: "AI, Data Science & Cybersecurity",
    channel: "NetworkChuck",
    skills: ["Wireshark", "Nmap", "Metasploit", "Port Scanning", "Firewalls"],
    videos: "18 videos",
    views: "3.4M views",
    url: "https://www.youtube.com/results?search_query=networkchuck+ethical+hacking+course",
    thumbnail: "https://img.youtube.com/vi/3Kq1MIfTWCE/mqdefault.jpg"
  },
  {
    id: 46,
    title: "Prompt Engineering & Generative AI Course",
    category: "AI, Data Science & Cybersecurity",
    channel: "freeCodeCamp.org",
    skills: ["LLM Basics", "Zero-Shot Prompting", "Few-Shot Prompting", "ChatGPT APIs"],
    videos: "Full Course",
    views: "2.3M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+prompt+engineering+course",
    thumbnail: "https://img.youtube.com/vi/_ZvnD93TgJ8/mqdefault.jpg"
  },
  {
    id: 47,
    title: "Natural Language Processing (NLP) Playlist",
    category: "AI, Data Science & Cybersecurity",
    channel: "Krish Naik",
    skills: ["Tokenization", "TF-IDF", "Word2Vec", "BERT Models", "Transformers"],
    videos: "38 videos",
    views: "1.8M views",
    url: "https://www.youtube.com/results?search_query=krish+naik+nlp+full+playlist",
    thumbnail: "https://img.youtube.com/vi/CMrHM8a3h88/mqdefault.jpg"
  },
  {
    id: 48,
    title: "Computer Vision with OpenCV and Python",
    category: "AI, Data Science & Cybersecurity",
    channel: "Murtaza's Workshop",
    skills: ["OpenCV", "Image Processing", "Object Tracking", "Face Detection"],
    videos: "22 videos",
    views: "2.2M views",
    url: "https://www.youtube.com/results?search_query=murtaza+opencv+computer+vision+course",
    thumbnail: "https://img.youtube.com/vi/WQeoO7MI0Bs/mqdefault.jpg"
  },
  {
    id: 49,
    title: "Statistics & Probability for Data Science",
    category: "AI, Data Science & Cybersecurity",
    channel: "StatQuest with Josh Starmer",
    skills: ["Normal Distribution", "Hypothesis Testing", "p-values", "Regression Analysis"],
    videos: "45 videos",
    views: "6.7M views",
    url: "https://www.youtube.com/results?search_query=statquest+statistics+for+data+science",
    thumbnail: "https://img.youtube.com/vi/qBigTkBLU6g/mqdefault.jpg"
  },
  {
    id: 50,
    title: "Information Security and Cryptography",
    category: "AI, Data Science & Cybersecurity",
    channel: "NPTEL",
    skills: ["Symmetric Encryption", "RSA Algorithm", "Hashing", "Digital Signatures"],
    videos: "40 videos",
    views: "1.1M views",
    url: "https://www.youtube.com/results?search_query=nptel+cryptography+information+security",
    thumbnail: "https://img.youtube.com/vi/jhXCTbFnK8o/mqdefault.jpg"
  },

  // ========================================================
  // CATEGORY 4: Government & Entrance Exam Preparation (20 Playlists)
  // ========================================================
  {
    id: 51,
    title: "SSC CGL Mathematics Complete Course",
    category: "Government & Entrance Exam Preparation",
    channel: "Aditya Ranjan Sir",
    skills: ["Arithmetic", "Algebra", "Geometry", "Trigonometry", "Speed Tricks"],
    videos: "95 videos",
    views: "18M views",
    url: "https://www.youtube.com/results?search_query=aditya+ranjan+sir+ssc+cgl+maths+complete",
    thumbnail: "https://img.youtube.com/vi/rN1vF3QjV80/mqdefault.jpg"
  },
  {
    id: 52,
    title: "General Science for Competitive Exams",
    category: "Government & Entrance Exam Preparation",
    channel: "Exampur",
    skills: ["Physics", "Chemistry", "Biology", "Everyday Science", "NCERT Facts"],
    videos: "80 videos",
    views: "8.4M views",
    url: "https://www.youtube.com/results?search_query=exampur+general+science+complete+playlist",
    thumbnail: "https://img.youtube.com/vi/Xl7P_m0u4z4/mqdefault.jpg"
  },
  {
    id: 53,
    title: "Indian Polity & Constitution Masterclass",
    category: "Government & Entrance Exam Preparation",
    channel: "Khan GS Research Centre",
    skills: ["Preamble", "Fundamental Rights", "Parliament", "Supreme Court", "Amendments"],
    videos: "50 videos",
    views: "24M views",
    url: "https://www.youtube.com/results?search_query=khan+sir+indian+polity+gs",
    thumbnail: "https://img.youtube.com/vi/vF0lK1_Tz7A/mqdefault.jpg"
  },
  {
    id: 54,
    title: "Indian History Complete (Ancient, Medieval, Modern)",
    category: "Government & Entrance Exam Preparation",
    channel: "StudyIQ Education",
    skills: ["Indus Valley", "Mughal Empire", "Freedom Struggle", "British Raj"],
    videos: "110 videos",
    views: "15M views",
    url: "https://www.youtube.com/results?search_query=studyiq+indian+history+complete+playlist",
    thumbnail: "https://img.youtube.com/vi/q4xM6hY9r1M/mqdefault.jpg"
  },
  {
    id: 55,
    title: "Indian & World Geography for Exams",
    category: "Government & Entrance Exam Preparation",
    channel: "Khan Sir GS",
    skills: ["Indian Rivers", "Mountains", "Climate", "Maps", "Physical Geography"],
    videos: "65 videos",
    views: "19M views",
    url: "https://www.youtube.com/results?search_query=khan+sir+geography+complete+playlist",
    thumbnail: "https://img.youtube.com/vi/h2U_lR5y6v8/mqdefault.jpg"
  },
  {
    id: 56,
    title: "Economics Concepts for SSC & UPSC",
    category: "Government & Entrance Exam Preparation",
    channel: "Mrunal Patel",
    skills: ["Inflation", "Monetary Policy", "GDP Calculation", "Budgeting", "Banking"],
    videos: "55 videos",
    views: "12M views",
    url: "https://www.youtube.com/results?search_query=mrunal+patel+economics+lectures",
    thumbnail: "https://img.youtube.com/vi/8g1P7sR0TqY/mqdefault.jpg"
  },
  {
    id: 57,
    title: "Daily Current Affairs & Analysis",
    category: "Government & Entrance Exam Preparation",
    channel: "StudyIQ IAS",
    skills: ["National News", "International Affairs", "Government Schemes", "Editorials"],
    videos: "Daily Updates",
    views: "10M views",
    url: "https://www.youtube.com/results?search_query=studyiq+current+affairs+daily",
    thumbnail: "https://img.youtube.com/vi/7j5kK3m0o2w/mqdefault.jpg"
  },
  {
    id: 58,
    title: "Railway RRB NTPC & Group D Preparation",
    category: "Government & Entrance Exam Preparation",
    channel: "Utkarsh Classes",
    skills: ["General Awareness", "General Science", "Maths", "Reasoning"],
    videos: "75 videos",
    views: "6.8M views",
    url: "https://www.youtube.com/results?search_query=utkarsh+classes+railway+rrb+ntpc",
    thumbnail: "https://img.youtube.com/vi/3yK1m0u4z4Q/mqdefault.jpg"
  },
  {
    id: 59,
    title: "Banking Quantitative Aptitude (IBPS & SBI)",
    category: "Government & Entrance Exam Preparation",
    channel: "Adda247",
    skills: ["Simplification", "Data Interpretation", "Arithmetic", "Quadratic Equations"],
    videos: "90 videos",
    views: "9.1M views",
    url: "https://www.youtube.com/results?search_query=adda247+banking+quant+complete+course",
    thumbnail: "https://img.youtube.com/vi/5vK1m0u4z4A/mqdefault.jpg"
  },
  {
    id: 60,
    title: "Reasoning Ability for Bank & SSC",
    category: "Government & Entrance Exam Preparation",
    channel: "Adda247 (Saurav Sir)",
    skills: ["Puzzles", "Seating Arrangement", "Syllogism", "Blood Relations", "Coding-Decoding"],
    videos: "85 videos",
    views: "8.3M views",
    url: "https://www.youtube.com/results?search_query=adda247+reasoning+for+bank+exams",
    thumbnail: "https://img.youtube.com/vi/2mK1m0u4z4B/mqdefault.jpg"
  },
  {
    id: 61,
    title: "NDA & Defense Services Exam Preparation",
    category: "Government & Entrance Exam Preparation",
    channel: "Major Kalshi Classes",
    skills: ["NDA Mathematics", "GAT Paper", "SSB Interview", "Current Affairs"],
    videos: "60 videos",
    views: "4.7M views",
    url: "https://www.youtube.com/results?search_query=major+kalshi+classes+nda+preparation",
    thumbnail: "https://img.youtube.com/vi/4lK1m0u4z4C/mqdefault.jpg"
  },
  {
    id: 62,
    title: "Police Constable & Sub-Inspector Exam Preparation",
    category: "Government & Entrance Exam Preparation",
    channel: "Utkarsh Classes",
    skills: ["State GK", "General Hindi", "Reasoning", "Law & Constitution"],
    videos: "70 videos",
    views: "5.5M views",
    url: "https://www.youtube.com/results?search_query=utkarsh+classes+police+constable+si",
    thumbnail: "https://img.youtube.com/vi/1nK1m0u4z4D/mqdefault.jpg"
  },
  {
    id: 63,
    title: "CTET & State TET Pedagogy Preparation",
    category: "Government & Entrance Exam Preparation",
    channel: "Let's LEARN (Himanshi Singh)",
    skills: ["Child Development", "Teaching Methodology", "Language Pedagogy", "EVS"],
    videos: "65 videos",
    views: "11M views",
    url: "https://www.youtube.com/results?search_query=lets+learn+ctet+pedagogy+himanshi+singh",
    thumbnail: "https://img.youtube.com/vi/6pK1m0u4z4E/mqdefault.jpg"
  },
  {
    id: 64,
    title: "State PCS General Studies Lectures",
    category: "Government & Entrance Exam Preparation",
    channel: "Drishti IAS",
    skills: ["History", "Polity", "Geography", "State Specific GK", "Answer Writing"],
    videos: "80 videos",
    views: "7.2M views",
    url: "https://www.youtube.com/results?search_query=drishti+ias+state+pcs+gs+lectures",
    thumbnail: "https://img.youtube.com/vi/8rK1m0u4z4F/mqdefault.jpg"
  },
  {
    id: 65,
    title: "Environment, Ecology & Biodiversity for Exams",
    category: "Government & Entrance Exam Preparation",
    channel: "Unacademy",
    skills: ["Ecosystems", "Climate Change", "Wildlife Sanctuaries", "Pollution Control"],
    videos: "45 videos",
    views: "3.9M views",
    url: "https://www.youtube.com/results?search_query=unacademy+environment+ecology+upsc",
    thumbnail: "https://img.youtube.com/vi/9sK1m0u4z4G/mqdefault.jpg"
  },
  {
    id: 66,
    title: "English for Competitive Exams (SSC, Bank, CGL)",
    category: "Government & Entrance Exam Preparation",
    channel: "English With Rani Ma'am",
    skills: ["Grammar Rules", "Error Detection", "Cloze Test", "Comprehension"],
    videos: "95 videos",
    views: "14M views",
    url: "https://www.youtube.com/results?search_query=rani+mam+english+for+competitive+exams",
    thumbnail: "https://img.youtube.com/vi/7tK1m0u4z4H/mqdefault.jpg"
  },
  {
    id: 67,
    title: "Static GK Complete Master Series",
    category: "Government & Entrance Exam Preparation",
    channel: "Parcham Classes",
    skills: ["National Parks", "Folk Dances", "UNESCO Sites", "Awards & Honours"],
    videos: "85 videos",
    views: "12M views",
    url: "https://www.youtube.com/results?search_query=parcham+classes+static+gk+complete+playlist",
    thumbnail: "https://img.youtube.com/vi/3uK1m0u4z4I/mqdefault.jpg"
  },
  {
    id: 68,
    title: "General Hindi (Hindi Vyakaran) for Exams",
    category: "Government & Entrance Exam Preparation",
    channel: "Exampur",
    skills: ["Sandhi", "Samas", "Muhavare", "Vilom Shabd", "Vyakaran"],
    videos: "60 videos",
    views: "4.8M views",
    url: "https://www.youtube.com/results?search_query=exampur+hindi+vyakaran+complete",
    thumbnail: "https://img.youtube.com/vi/4vK1m0u4z4J/mqdefault.jpg"
  },
  {
    id: 69,
    title: "Computer Awareness for Bank and SSC Exams",
    category: "Government & Entrance Exam Preparation",
    channel: "Adda247",
    skills: ["Computer Hardware", "Software", "Internet Terminology", "MS Office", "Shortcuts"],
    videos: "40 videos",
    views: "3.6M views",
    url: "https://www.youtube.com/results?search_query=adda247+computer+awareness+bank+ssc",
    thumbnail: "https://img.youtube.com/vi/5wK1m0u4z4K/mqdefault.jpg"
  },
  {
    id: 70,
    title: "Important Government Schemes & Yojana Analysis",
    category: "Government & Entrance Exam Preparation",
    channel: "StudyIQ",
    skills: ["Central Govt Schemes", "Welfare Programmes", "Subsidies", "Exam Analysis"],
    videos: "50 videos",
    views: "6.1M views",
    url: "https://www.youtube.com/results?search_query=studyiq+government+schemes+yojana",
    thumbnail: "https://img.youtube.com/vi/6xK1m0u4z4L/mqdefault.jpg"
  },

  // ========================================================
  // CATEGORY 5: English & Communication Skills (10 Playlists)
  // ========================================================
  {
    id: 71,
    title: "Spoken English Course for Beginners (Hindi to English)",
    category: "English & Communication Skills",
    channel: "TsMadaan",
    skills: ["Daily Conversation", "Basic Tenses", "Confidence Building", "Pronunciation"],
    videos: "45 videos",
    views: "16M views",
    url: "https://www.youtube.com/results?search_query=tsmadaan+spoken+english+course",
    thumbnail: "https://img.youtube.com/vi/1yK1m0u4z4M/mqdefault.jpg"
  },
  {
    id: 72,
    title: "English Speaking Practice Lessons",
    category: "English & Communication Skills",
    channel: "Learnex",
    skills: ["Fluency", "Small Talk", "Sentence Framing", "Idioms"],
    videos: "60 videos",
    views: "9.2M views",
    url: "https://www.youtube.com/results?search_query=learnex+english+speaking+practice",
    thumbnail: "https://img.youtube.com/vi/2zK1m0u4z4N/mqdefault.jpg"
  },
  {
    id: 73,
    title: "English Grammar Course from Basics",
    category: "English & Communication Skills",
    channel: "Dear Sir",
    skills: ["Tenses", "Parts of Speech", "Active Passive Voice", "Direct Indirect"],
    videos: "35 videos",
    views: "32M views",
    url: "https://www.youtube.com/playlist?list=PLxb0szL_9n8V-N9c9wP7sI_fP0iK7w041",
    thumbnail: "https://img.youtube.com/vi/m_Qn4k8i2k4/mqdefault.jpg"
  },
  {
    id: 74,
    title: "Daily Use English Sentences & Practice",
    category: "English & Communication Skills",
    channel: "English Connection",
    skills: ["Everyday Sentences", "Common Errors", "Home & College English"],
    videos: "50 videos",
    views: "8.1M views",
    url: "https://www.youtube.com/results?search_query=english+connection+daily+use+sentences",
    thumbnail: "https://img.youtube.com/vi/3aK1m0u4z4O/mqdefault.jpg"
  },
  {
    id: 75,
    title: "Vocabulary Building & Word Power Made Easy",
    category: "English & Communication Skills",
    channel: "Vocab with Neetu Singh",
    skills: ["Root Words", "Synonyms", "Antonyms", "One Word Substitution"],
    videos: "40 videos",
    views: "5.7M views",
    url: "https://www.youtube.com/results?search_query=neetu+singh+english+vocab+playlist",
    thumbnail: "https://img.youtube.com/vi/4bK1m0u4z4P/mqdefault.jpg"
  },
  {
    id: 76,
    title: "Business English & Professional Workplace Communication",
    category: "English & Communication Skills",
    channel: "BBC Learning English",
    skills: ["Formal English", "Meetings", "Office Conversations", "Professional Tone"],
    videos: "30 videos",
    views: "4.3M views",
    url: "https://www.youtube.com/results?search_query=bbc+learning+english+business+communication",
    thumbnail: "https://img.youtube.com/vi/5cK1m0u4z4Q/mqdefault.jpg"
  },
  {
    id: 77,
    title: "English Pronunciation & Accent Training",
    category: "English & Communication Skills",
    channel: "Rachel's English",
    skills: ["Vowel Sounds", "Consonants", "Intonation", "Connected Speech"],
    videos: "50 videos",
    views: "12M views",
    url: "https://www.youtube.com/results?search_query=rachels+english+pronunciation+guide",
    thumbnail: "https://img.youtube.com/vi/6dK1m0u4z4R/mqdefault.jpg"
  },
  {
    id: 78,
    title: "Public Speaking & Presentation Skills Masterclass",
    category: "English & Communication Skills",
    channel: "TEDx Talks / Dananjaya Hettiarachchi",
    skills: ["Body Language", "Speech Delivery", "Overcoming Stage Fear", "Storytelling"],
    videos: "15 videos",
    views: "7.8M views",
    url: "https://www.youtube.com/results?search_query=tedx+public+speaking+skills+presentation",
    thumbnail: "https://img.youtube.com/vi/7eK1m0u4z4S/mqdefault.jpg"
  },
  {
    id: 79,
    title: "Professional Email Writing & Business Etiquette",
    category: "English & Communication Skills",
    channel: "Oxford Online English",
    skills: ["Formal Inquiries", "Follow-ups", "Subject Lines", "Polite Requests"],
    videos: "18 videos",
    views: "3.2M views",
    url: "https://www.youtube.com/results?search_query=oxford+online+english+email+writing",
    thumbnail: "https://img.youtube.com/vi/8fK1m0u4z4T/mqdefault.jpg"
  },
  {
    id: 80,
    title: "Group Discussion & Interview Communication Skills",
    category: "English & Communication Skills",
    channel: "Learn English Lab",
    skills: ["Initiating GD", "Disagreeing Politely", "Summarizing", "Voice Modulation"],
    videos: "20 videos",
    views: "2.9M views",
    url: "https://www.youtube.com/results?search_query=group+discussion+skills+tips+interview",
    thumbnail: "https://img.youtube.com/vi/9gK1m0u4z4U/mqdefault.jpg"
  },

  // ========================================================
  // CATEGORY 6: Career Skills, Resume & Interview (10 Playlists)
  // ========================================================
  {
    id: 81,
    title: "Resume Writing & ATS-Friendly CV Formatting",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "CareerVidz",
    skills: ["ATS Formatting", "Action Verbs", "Work Experience", "Fresher Resumes"],
    videos: "15 videos",
    views: "4.9M views",
    url: "https://www.youtube.com/results?search_query=careervidz+resume+writing+tips",
    thumbnail: "https://img.youtube.com/vi/1hK1m0u4z4V/mqdefault.jpg"
  },
  {
    id: 82,
    title: "Top Job Interview Questions & High-Scoring Answers",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "CareerVidz",
    skills: ["Tell Me About Yourself", "Strengths & Weaknesses", "Behavioral Questions"],
    videos: "25 videos",
    views: "15M views",
    url: "https://www.youtube.com/results?search_query=careervidz+job+interview+questions+answers",
    thumbnail: "https://img.youtube.com/vi/2iK1m0u4z4W/mqdefault.jpg"
  },
  {
    id: 83,
    title: "HR Interview Preparation (Hindi Guidance)",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "Skillopedia / Josh Talks",
    skills: ["Salary Expectations", "Career Gaps", "Company Research", "Confidence"],
    videos: "22 videos",
    views: "6.2M views",
    url: "https://www.youtube.com/results?search_query=hr+interview+questions+answers+hindi",
    thumbnail: "https://img.youtube.com/vi/3jK1m0u4z4X/mqdefault.jpg"
  },
  {
    id: 84,
    title: "Technical Coding Interview Preparation (Blind 75)",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "NeetCode",
    skills: ["LeetCode Strategy", "Problem Solving", "Time Complexity", "System Design"],
    videos: "75 videos",
    views: "8.5M views",
    url: "https://www.youtube.com/results?search_query=neetcode+technical+interview+prep",
    thumbnail: "https://img.youtube.com/vi/4kK1m0u4z4Y/mqdefault.jpg"
  },
  {
    id: 85,
    title: "LinkedIn Profile Optimization for Students & Freshers",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "Wonsulting",
    skills: ["Headline Optimization", "Networking", "Cold Messaging", "Job Search"],
    videos: "12 videos",
    views: "2.8M views",
    url: "https://www.youtube.com/results?search_query=wonsulting+linkedin+profile+tips",
    thumbnail: "https://img.youtube.com/vi/5lK1m0u4z4Z/mqdefault.jpg"
  },
  {
    id: 86,
    title: "Productivity & Time Management for Students",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "Ali Abdaal",
    skills: ["Pomodoro Technique", "Study Systems", "Goal Setting", "Focus"],
    videos: "16 videos",
    views: "9.3M views",
    url: "https://www.youtube.com/results?search_query=ali+abdaal+productivity+time+management",
    thumbnail: "https://img.youtube.com/vi/6mK1m0u4z5A/mqdefault.jpg"
  },
  {
    id: 87,
    title: "Personality Development & Soft Skills Masterclass",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "Dr. Vivek Bindra / TsMadaan",
    skills: ["Positive Mindset", "Leadership", "Interpersonal Skills", "Emotional Intelligence"],
    videos: "20 videos",
    views: "7.1M views",
    url: "https://www.youtube.com/results?search_query=personality+development+soft+skills+hindi",
    thumbnail: "https://img.youtube.com/vi/7nK1m0u4z5B/mqdefault.jpg"
  },
  {
    id: 88,
    title: "Freelancing for Beginners (Step-by-Step)",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "Hisham Sarwar",
    skills: ["Upwork", "Fiverr", "Client Communication", "Proposal Writing", "Portfolio"],
    videos: "35 videos",
    views: "5.4M views",
    url: "https://www.youtube.com/results?search_query=hisham+sarwar+freelancing+course",
    thumbnail: "https://img.youtube.com/vi/8oK1m0u4z5C/mqdefault.jpg"
  },
  {
    id: 89,
    title: "Developer Portfolio Building from Scratch",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "freeCodeCamp.org",
    skills: ["Portfolio Website", "Showcasing Projects", "Deploying with Vercel", "GitHub"],
    videos: "Full Course",
    views: "1.8M views",
    url: "https://www.youtube.com/results?search_query=freecodecamp+portfolio+building+guide",
    thumbnail: "https://img.youtube.com/vi/9pK1m0u4z5D/mqdefault.jpg"
  },
  {
    id: 90,
    title: "Corporate Etiquette & Workplace Professionalism",
    category: "Career Skills, Resume & Interview Preparation",
    channel: "Self Management Group",
    skills: ["Professional Grooming", "Virtual Meeting Etiquette", "Office Politics", "Ethics"],
    videos: "14 videos",
    views: "1.5M views",
    url: "https://www.youtube.com/results?search_query=salary+negotiation+corporate+etiquette+freshers",
    thumbnail: "https://img.youtube.com/vi/1qK1m0u4z5E/mqdefault.jpg"
  },

  // ========================================================
  // CATEGORY 7: Mathematics & Aptitude (10 Playlists)
  // ========================================================
  {
    id: 91,
    title: "Quantitative Aptitude for Campus Placements & Exams",
    category: "Mathematics & Aptitude",
    channel: "Feel Free to Learn",
    skills: ["Percentages", "Ratios", "Averages", "Alligation & Mixture", "Shortcuts"],
    videos: "80 videos",
    views: "14M views",
    url: "https://www.youtube.com/results?search_query=feel+free+to+learn+quantitative+aptitude",
    thumbnail: "https://img.youtube.com/vi/2rK1m0u4z5F/mqdefault.jpg"
  },
  {
    id: 92,
    title: "Vedic Maths & Fast Calculation Tricks",
    category: "Mathematics & Aptitude",
    channel: "Dear Sir",
    skills: ["Multiplication Tricks", "Square Roots", "Cube Roots", "Mental Math"],
    videos: "15 videos",
    views: "22M views",
    url: "https://www.youtube.com/results?search_query=dear+sir+vedic+maths+tricks",
    thumbnail: "https://img.youtube.com/vi/3sK1m0u4z5G/mqdefault.jpg"
  },
  {
    id: 93,
    title: "Speed Maths & Fast Calculation Techniques",
    category: "Mathematics & Aptitude",
    channel: "Adda247",
    skills: ["Tables", "Fraction to Percentage", "Approximation", "Fast Addition"],
    videos: "25 videos",
    views: "6.2M views",
    url: "https://www.youtube.com/results?search_query=speed+maths+fast+calculation+tricks",
    thumbnail: "https://img.youtube.com/vi/4tK1m0u4z5H/mqdefault.jpg"
  },
  {
    id: 94,
    title: "Logical Reasoning Complete Placement Course",
    category: "Mathematics & Aptitude",
    channel: "CareerRide",
    skills: ["Number Series", "Analogy", "Direction Sense", "Coding Decoding", "Venn Diagrams"],
    videos: "50 videos",
    views: "8.6M views",
    url: "https://www.youtube.com/results?search_query=careerride+logical+reasoning+full+course",
    thumbnail: "https://img.youtube.com/vi/5uK1m0u4z5I/mqdefault.jpg"
  },
  {
    id: 95,
    title: "Number System Complete Mathematics Series",
    category: "Mathematics & Aptitude",
    channel: "Sahil Sir",
    skills: ["Divisibility Rules", "Unit Digit", "Factors", "Remainders", "HCF & LCM"],
    videos: "30 videos",
    views: "7.3M views",
    url: "https://www.youtube.com/results?search_query=sahil+sir+number+system+maths",
    thumbnail: "https://img.youtube.com/vi/6vK1m0u4z5J/mqdefault.jpg"
  },
  {
    id: 96,
    title: "Percentages, Profit & Loss Masterclass",
    category: "Mathematics & Aptitude",
    channel: "Gagan Pratap Sir",
    skills: ["Percentage Concepts", "Cost Price / Selling Price", "Discounts", "Market Price"],
    videos: "40 videos",
    views: "11M views",
    url: "https://www.youtube.com/results?search_query=gagan+pratap+maths+percentage+profit+loss",
    thumbnail: "https://img.youtube.com/vi/7wK1m0u4z5K/mqdefault.jpg"
  },
  {
    id: 97,
    title: "Time, Speed & Distance / Work & Wages",
    category: "Mathematics & Aptitude",
    channel: "Rakesh Yadav Sir",
    skills: ["Relative Speed", "Trains & Platforms", "Boats & Streams", "Pipes & Cisterns"],
    videos: "35 videos",
    views: "9.8M views",
    url: "https://www.youtube.com/results?search_query=rakesh+yadav+maths+time+and+work",
    thumbnail: "https://img.youtube.com/vi/8xK1m0u4z5L/mqdefault.jpg"
  },
  {
    id: 98,
    title: "Permutations, Combinations & Probability",
    category: "Mathematics & Aptitude",
    channel: "Khan Academy",
    skills: ["Factorials", "Permutations", "Combinations", "Independent Events", "Probability"],
    videos: "25 videos",
    views: "4.1M views",
    url: "https://www.youtube.com/results?search_query=khan+academy+permutation+combination+probability",
    thumbnail: "https://img.youtube.com/vi/9yK1m0u4z5M/mqdefault.jpg"
  },
  {
    id: 99,
    title: "Data Interpretation (DI) & Graph Analysis",
    category: "Mathematics & Aptitude",
    channel: "Adda247",
    skills: ["Bar Graphs", "Pie Charts", "Line Graphs", "Table DI", "Caselet DI"],
    videos: "45 videos",
    views: "5.5M views",
    url: "https://www.youtube.com/results?search_query=data+interpretation+graphs+bank+ssc",
    thumbnail: "https://img.youtube.com/vi/1zK1m0u4z5N/mqdefault.jpg"
  },
  {
    id: 100,
    title: "High School Mathematics Refresher (Algebra & Geometry)",
    category: "Mathematics & Aptitude",
    channel: "Khan Academy",
    skills: ["Linear Equations", "Quadratic Equations", "Coordinate Geometry", "Triangles"],
    videos: "50 videos",
    views: "8.2M views",
    url: "https://www.youtube.com/results?search_query=khan+academy+algebra+geometry+basics",
    thumbnail: "https://img.youtube.com/vi/2aK1m0u4z5O/mqdefault.jpg"
  }
];

// Fallback SVG data URI for when a thumbnail fails to load
const fallbackThumbnail = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20320%20180%22%20width%3D%22320%22%20height%3D%22180%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%231e3a8a%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%232563eb%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22320%22%20height%3D%22180%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%22160%22%20cy%3D%2290%22%20r%3D%2236%22%20fill%3D%22%23ffffff%22%20opacity%3D%220.15%22%2F%3E%3Cpolygon%20points%3D%22152%2C76%20174%2C90%20152%2C104%22%20fill%3D%22%23ffffff%22%2F%3E%3Ctext%20x%3D%22160%22%20y%3D%22146%22%20fill%3D%22%23bfdbfe%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%3ELEARNING%20RESOURCE%3C%2Ftext%3E%3C%2Fsvg%3E";

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryFilters = document.getElementById('categoryFilters');
  const playlistsGrid = document.getElementById('playlistsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const activeFilterLabel = document.getElementById('activeFilterLabel');
  const noResultsContainer = document.getElementById('noResultsContainer');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  let currentCategory = 'All';
  let searchQuery = '';

  // Calculate and update category pill counts
  function updateCategoryPillCounts() {
    const counts = { All: playlists.length };
    playlists.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    if (categoryFilters) {
      const pills = categoryFilters.querySelectorAll('.filter-pill');
      pills.forEach(pill => {
        const cat = pill.getAttribute('data-category');
        const countSpan = pill.querySelector('.pill-count');
        if (countSpan && counts[cat] !== undefined) {
          countSpan.textContent = `(${counts[cat]})`;
        }
      });
    }
  }

  // Filter and return matching playlists
  function getFilteredPlaylists() {
    const q = searchQuery.trim().toLowerCase();

    return playlists.filter(item => {
      // 1. Category match
      const matchesCategory = (currentCategory === 'All') || (item.category === currentCategory);

      // 2. Search query match (title, category, channel, and skills)
      let matchesQuery = true;
      if (q) {
        const titleMatch = item.title.toLowerCase().includes(q);
        const categoryMatch = item.category.toLowerCase().includes(q);
        const channelMatch = item.channel.toLowerCase().includes(q);
        const skillsMatch = item.skills.some(skill => skill.toLowerCase().includes(q));
        matchesQuery = titleMatch || categoryMatch || channelMatch || skillsMatch;
      }

      return matchesCategory && matchesQuery;
    });
  }

  // Render cards into grid
  function renderPlaylists() {
    const filtered = getFilteredPlaylists();

    // Update count indicator
    if (resultsCount) {
      resultsCount.textContent = `Showing ${filtered.length} playlist${filtered.length === 1 ? '' : 's'}`;
    }

    // Update active filter label
    if (activeFilterLabel) {
      if (searchQuery.trim() && currentCategory !== 'All') {
        activeFilterLabel.textContent = `${currentCategory} • "${searchQuery.trim()}"`;
      } else if (searchQuery.trim()) {
        activeFilterLabel.textContent = `Search: "${searchQuery.trim()}"`;
      } else {
        activeFilterLabel.textContent = currentCategory === 'All' ? 'All Categories' : currentCategory;
      }
    }

    // Handle empty state
    if (filtered.length === 0) {
      if (playlistsGrid) playlistsGrid.style.display = 'none';
      if (noResultsContainer) noResultsContainer.style.display = 'block';
      return;
    }

    if (playlistsGrid) {
      playlistsGrid.style.display = 'grid';
    }
    if (noResultsContainer) {
      noResultsContainer.style.display = 'none';
    }

    // Generate HTML for filtered playlists
    const cardsHtml = filtered.map(item => `
      <div class="yt-card" data-id="${item.id}">
        <div class="yt-card-thumbnail-wrap">
          <img 
            src="${item.thumbnail}" 
            alt="${item.title}" 
            class="yt-card-thumb" 
            loading="lazy"
            onerror="this.onerror=null; this.src='${fallbackThumbnail}';"
          >
          <div class="yt-card-badge">${item.videos}</div>
        </div>
        <div class="yt-card-body">
          <div class="yt-card-category">${item.category}</div>
          <h3 class="yt-card-title" title="${item.title}">${item.title}</h3>
          <div class="yt-card-channel">
            <span class="yt-channel-icon">▶</span> ${item.channel}
          </div>
          <div class="yt-skills-tags">
            ${item.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          </div>
          <div class="yt-card-footer">
            <div class="yt-card-meta">
              <span>⏱ ${item.videos}</span> • <span>👁 ${item.views}</span>
            </div>
            <a 
              href="${item.url}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-primary watch-youtube-btn"
              title="Watch on YouTube"
            >
              ▶ Watch on YouTube
            </a>
          </div>
        </div>
      </div>
    `).join('');

    if (playlistsGrid) {
      playlistsGrid.innerHTML = cardsHtml;
    }
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery.trim() ? 'block' : 'none';
      }
      renderPlaylists();
    });
  }

  // Clear search button handler
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderPlaylists();
    });
  }

  // Category filter pill clicks
  if (categoryFilters) {
    categoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;

      const cat = btn.getAttribute('data-category');
      if (!cat) return;

      currentCategory = cat;

      // Update active pill UI
      const allPills = categoryFilters.querySelectorAll('.filter-pill');
      allPills.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      renderPlaylists();
    });
  }

  // Reset filters button in empty state
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      searchQuery = '';
      currentCategory = 'All';
      if (searchInput) {
        searchInput.value = '';
      }
      if (clearSearchBtn) {
        clearSearchBtn.style.display = 'none';
      }
      if (categoryFilters) {
        const allPills = categoryFilters.querySelectorAll('.filter-pill');
        allPills.forEach(p => {
          if (p.getAttribute('data-category') === 'All') {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });
      }
      renderPlaylists();
    });
  }

  // Initialize pill counts and render all playlists
  updateCategoryPillCounts();
  renderPlaylists();
});
