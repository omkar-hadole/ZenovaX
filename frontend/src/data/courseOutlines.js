// Course Outline data — simple Year → Course → Outline viewer for learners.
// Structured so syllabus versions can later be managed by Admin behind the
// scenes (each entry carries a syllabusVersion that the UI currently ignores;
// learners always see the applicable/current outline).

export const YEARS = [
    { id: 1, label: '1st Year', shortLabel: '1st' },
    { id: 2, label: '2nd Year', shortLabel: '2nd' },
    { id: 3, label: '3rd Year', shortLabel: '3rd' },
    { id: 4, label: '4th Year', shortLabel: '4th' },
];

export const COURSE_OUTLINES = [
    {
        id: 'prog-fundamentals',
        yearId: 1,
        name: 'Programming Fundamentals',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Introduction to Programming', topics: ['Algorithms & Flowcharts', 'Variables & Data Types', 'Operators & Expressions'] },
            { number: 2, title: 'Control Flow', topics: ['Conditionals', 'Loops', 'Nested Control Structures'] },
            { number: 3, title: 'Functions & Arrays', topics: ['Functions & Parameters', 'Recursion Basics', '1D & 2D Arrays'] },
            { number: 4, title: 'Pointers & Files', topics: ['Pointer Basics', 'Strings', 'File Handling'] },
        ],
    },
    {
        id: 'applied-math',
        yearId: 1,
        name: 'Applied Mathematics',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Matrices & Determinants', topics: ['Matrix Operations', 'Inverse of a Matrix', 'Rank of Matrix'] },
            { number: 2, title: 'Differential Calculus', topics: ['Limits & Continuity', 'Derivatives', 'Maxima & Minima'] },
            { number: 3, title: 'Integral Calculus', topics: ['Indefinite Integrals', 'Definite Integrals', 'Applications of Integration'] },
            { number: 4, title: 'Differential Equations', topics: ['First Order Equations', 'Linear Differential Equations', 'Applications'] },
        ],
    },
    {
        id: 'computer-fundamentals',
        yearId: 1,
        name: 'Computer Fundamentals',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Computer System Basics', topics: ['Evolution of Computers', 'Hardware & Software', 'Input & Output Devices'] },
            { number: 2, title: 'Memory & Storage', topics: ['Primary Memory', 'Secondary Storage', 'Storage Devices'] },
            { number: 3, title: 'Operating Environment', topics: ['OS Basics', 'File Management', 'Utility Software'] },
            { number: 4, title: 'Networks & Internet', topics: ['Network Types', 'Internet Basics', 'Internet Services'] },
        ],
    },
    {
        id: 'web-fundamentals',
        yearId: 1,
        name: 'Web Fundamentals',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Web Introduction', topics: ['How the Web Works', 'Browsers & Servers', 'URLs & HTTP'] },
            { number: 2, title: 'HTML', topics: ['HTML Structure', 'Forms & Tables', 'Semantic HTML'] },
            { number: 3, title: 'CSS', topics: ['Selectors & Box Model', 'Flexbox & Grid', 'Responsive Design'] },
        ],
    },

    {
        id: 'data-structures',
        yearId: 2,
        name: 'Data Structures',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Introduction', topics: ['Data structures basics', 'Complexity', 'Big O notation'] },
            { number: 2, title: 'Arrays & Linked Lists', topics: ['Arrays', 'Linked Lists', 'Operations'] },
            { number: 3, title: 'Trees', topics: ['Binary Trees', 'Binary Search Trees', 'Tree Traversal'] },
            { number: 4, title: 'Graphs', topics: ['Graph Representation', 'BFS', 'DFS'] },
        ],
    },
    {
        id: 'dbms',
        yearId: 2,
        name: 'Database Management System',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Introduction to DBMS', topics: ['Database Concepts', 'DBMS Architecture', 'ER Model'] },
            { number: 2, title: 'Relational Model', topics: ['Relational Algebra', 'Keys & Constraints', 'Normalization'] },
            { number: 3, title: 'SQL', topics: ['DDL & DML Queries', 'Joins & Subqueries', 'Views & Indexes'] },
            { number: 4, title: 'Transactions', topics: ['ACID Properties', 'Concurrency Control', 'Recovery Techniques'] },
        ],
    },
    {
        id: 'operating-systems',
        yearId: 2,
        name: 'Operating Systems',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'OS Overview', topics: ['OS Functions & Types', 'System Calls', 'Processes & Threads'] },
            { number: 2, title: 'CPU Scheduling', topics: ['Scheduling Criteria', 'FCFS & SJF', 'Round Robin & Priority'] },
            { number: 3, title: 'Process Synchronization', topics: ['Critical Section', 'Semaphores', 'Deadlocks'] },
            { number: 4, title: 'Memory Management', topics: ['Paging & Segmentation', 'Virtual Memory', 'Page Replacement'] },
        ],
    },
    {
        id: 'computer-networks',
        yearId: 2,
        name: 'Computer Networks',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Network Basics', topics: ['Network Types & Topologies', 'Transmission Media', 'OSI & TCP/IP Models'] },
            { number: 2, title: 'Data Link Layer', topics: ['Framing', 'Error Detection', 'Flow Control'] },
            { number: 3, title: 'Network Layer', topics: ['IP Addressing', 'Routing Algorithms', 'Subnetting'] },
            { number: 4, title: 'Transport & Application Layer', topics: ['TCP & UDP', 'DNS', 'HTTP, FTP & Email'] },
        ],
    },
    {
        id: 'discrete-math',
        yearId: 2,
        name: 'Discrete Mathematics',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Logic & Proofs', topics: ['Propositional Logic', 'Predicate Logic', 'Proof Techniques'] },
            { number: 2, title: 'Set Theory & Relations', topics: ['Sets & Operations', 'Relations', 'Functions'] },
            { number: 3, title: 'Combinatorics', topics: ['Permutations & Combinations', 'Pigeonhole Principle', 'Inclusion-Exclusion'] },
            { number: 4, title: 'Graph Theory', topics: ['Graphs & Paths', 'Euler & Hamilton Circuits', 'Trees'] },
        ],
    },

    {
        id: 'software-engineering',
        yearId: 3,
        name: 'Software Engineering',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Software Process Models', topics: ['SDLC Overview', 'Waterfall & Agile', 'Scrum Framework'] },
            { number: 2, title: 'Requirements Engineering', topics: ['Requirement Elicitation', 'SRS Documents', 'Feasibility Study'] },
            { number: 3, title: 'Design & Modeling', topics: ['Architectural Design', 'UML Diagrams', 'Design Patterns Intro'] },
            { number: 4, title: 'Testing & Maintenance', topics: ['Unit & Integration Testing', 'Black-box vs White-box', 'Maintenance Types'] },
        ],
    },
    {
        id: 'dsa-advanced',
        yearId: 3,
        name: 'Advanced Algorithms',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Algorithm Design Techniques', topics: ['Divide & Conquer', 'Greedy Algorithms', 'Dynamic Programming'] },
            { number: 2, title: 'Graph Algorithms', topics: ['Dijkstra\'s Algorithm', 'Bellman-Ford', 'Minimum Spanning Trees'] },
            { number: 3, title: 'String Algorithms', topics: ['String Matching', 'KMP Algorithm', 'Hashing'] },
            { number: 4, title: 'NP-Theory', topics: ['P vs NP', 'NP-Completeness', 'Reduction Techniques'] },
        ],
    },
    {
        id: 'machine-learning',
        yearId: 3,
        name: 'Machine Learning',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Foundations of ML', topics: ['Types of Learning', 'Data Preprocessing', 'Model Evaluation'] },
            { number: 2, title: 'Supervised Learning', topics: ['Linear Regression', 'Classification', 'Decision Trees'] },
            { number: 3, title: 'Unsupervised Learning', topics: ['Clustering', 'K-Means', 'Dimensionality Reduction'] },
            { number: 4, title: 'Neural Networks', topics: ['Perceptron', 'Activation Functions', 'Intro to Deep Learning'] },
        ],
    },
    {
        id: 'mobile-dev',
        yearId: 3,
        name: 'Mobile Application Development',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Mobile Dev Landscape', topics: ['Native vs Hybrid Apps', 'Android Architecture', 'App Lifecycle'] },
            { number: 2, title: 'UI Development', topics: ['Layouts & Views', 'Material Design', 'Navigation'] },
            { number: 3, title: 'Data & Storage', topics: ['Local Storage', 'SQLite & Room', 'REST API Integration'] },
            { number: 4, title: 'Deployment', topics: ['Debugging & Testing', 'App Signing', 'Play Store Release'] },
        ],
    },

    {
        id: 'cloud-computing',
        yearId: 4,
        name: 'Cloud Computing',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Cloud Foundations', topics: ['Cloud Service Models', 'Deployment Models', 'Virtualization'] },
            { number: 2, title: 'Cloud Architecture', topics: ['Compute & Storage Services', 'Load Balancing', 'Auto Scaling'] },
            { number: 3, title: 'DevOps & Containers', topics: ['CI/CD Pipelines', 'Docker Basics', 'Kubernetes Intro'] },
            { number: 4, title: 'Security & Cost', topics: ['IAM Basics', 'Cloud Security Practices', 'Cost Optimization'] },
        ],
    },
    {
        id: 'cyber-security',
        yearId: 4,
        name: 'Cyber Security',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'Security Fundamentals', topics: ['CIA Triad', 'Threats & Attacks', 'Security Policies'] },
            { number: 2, title: 'Network Security', topics: ['Firewalls', 'IDS & IPS', 'VPNs'] },
            { number: 3, title: 'Web & App Security', topics: ['OWASP Top 10', 'SQL Injection & XSS', 'Secure Coding'] },
            { number: 4, title: 'Cryptography', topics: ['Symmetric Encryption', 'Asymmetric Encryption', 'Hashing & Signatures'] },
        ],
    },
    {
        id: 'ai-deep-learning',
        yearId: 4,
        name: 'Artificial Intelligence & Deep Learning',
        syllabusVersion: '2025–26',
        units: [
            { number: 1, title: 'AI Concepts', topics: ['Search Strategies', 'Knowledge Representation', 'Expert Systems'] },
            { number: 2, title: 'Deep Neural Networks', topics: ['Feedforward Networks', 'Backpropagation', 'Optimizers'] },
            { number: 3, title: 'CNNs & RNNs', topics: ['Convolutional Networks', 'Recurrent Networks', 'LSTM'] },
            { number: 4, title: 'Modern AI', topics: ['Transformers', 'LLMs Overview', 'Ethics in AI'] },
        ],
    },
];

export const getCoursesForYear = (yearId) =>
    COURSE_OUTLINES.filter(c => c.yearId === yearId);

export const getCourseById = (yearId, courseId) =>
    COURSE_OUTLINES.find(c => c.yearId === yearId && c.id === courseId);
