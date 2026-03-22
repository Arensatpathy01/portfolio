/* =============================================
   CHATBOT ANSWERS — Local offline knowledge base
   about Aren + general tech topics
   ============================================= */

function getLocalAnswer(query) {
    const q = query.toLowerCase().trim();

    // Helper: check if a standalone word/phrase exists (word-boundary match)
    function isAbout(topic) {
        const pattern = new RegExp('\\b' + topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
        return pattern.test(q);
    }

    // === About Aren ===
    if ((q.includes('who') && q.includes('aren')) || (q.includes('about') && q.includes('aren')) || q.includes('tell me about you') || q.includes('introduce')) {
        return '👤 **Aren Satpathy** is a Software Engineer 2 at **NetApp** with 3+ years of experience in real-time embedded systems, C++, Python, and DevOps. Previously worked at **Boeing** and **Cognizant**. B.Tech from **VSSUT, Burla**. Based in Bengaluru, India.';
    }
    if (q.includes('skill') || q.includes('tech stack') || (q.includes('what') && q.includes('know'))) {
        return '**Aren\'s Key Skills:**\n• **Programming:** C++, Embedded C++, Python, SQL, STL\n• **Systems:** Embedded Systems, Operating Systems, Data Structures, OOPS, Multithreading\n• **DevOps:** Jenkins, CI/CD, Docker, GitLab, Linux, Wireshark\n• **Methodologies:** SDLC, Embedded Programming';
    }
    if (q.includes('experience') || q.includes('work') || q.includes('job') || q.includes('career') || q.includes('company') || q.includes('companies')) {
        return '**Aren\'s Work Experience (3+ Years):**\n\n🏢 **Software Engineer 2** — NetApp (Nov 2025 – Present)\nEnterprise-grade storage solutions.\n\n✈️ **Embedded C++ Engineer** — Boeing (Jun 2024 – Nov 2025)\nReal-time data acquisition, WebSocket streaming, multi-threaded systems.\n\n💼 **Software Engineer** — Cognizant (Jun 2022 – May 2024)\nTechOps for Nike Converse, Feature Store, testing & automation.';
    }
    if (q.includes('netapp')) {
        return '🏢 Aren is currently a **Software Engineer 2 at NetApp** (Nov 2025 – Present, Bengaluru), working on enterprise-grade storage solutions.';
    }
    if (q.includes('boeing')) {
        return '✈️ At **Boeing** (Jun 2024 – Nov 2025), Aren:\n• Led real-time data acquisition modules in C++\n• Built WebSocket-based data streaming interfaces\n• Processed protocol data (serial bus, GPS, CAN)\n• Created 1000+ virtual channel IDs\n• Developed timing control for jitter-free transmission';
    }
    if (q.includes('cognizant') || q.includes('nike')) {
        return '💼 At **Cognizant** (Jun 2022 – May 2024), Aren:\n• TechOps support for Nike Converse stores\n• Built Feature Store (200+ features, 30-50% work reduction)\n• Managed incidents via Jira & ServiceNow\n• Developed test automation scripts';
    }
    if (q.includes('education') || q.includes('college') || q.includes('university') || q.includes('school') || q.includes('degree') || q.includes('vssut')) {
        return '🎓 **Education:**\n• **Bachelor of Technology** — VSSUT, Burla (2022)\n• **Class XII** — KV Koliwada, Mumbai (2018)\n• **Class X** — KV Koliwada, Mumbai (2016)';
    }
    if (q.includes('certif') || (q.includes('azure') && !isAbout('azure devops')) || q.includes('microsoft')) {
        return '🏅 **Certifications:**\n• Azure Fundamentals (AZ-900) — Microsoft\n• Microsoft Certified Azure Administrator Associate';
    }
    if (q.includes('project') || q.includes('brain') || q.includes('tumor') || q.includes('deep learning')) {
        return '🧠 **Brain Tumor Detection Using Deep Learning** (151 days)\nA system using ML/DL on MRI images for quick & accurate brain tumor prediction, helping radiologists make faster decisions.';
    }
    if (q.includes('contact') || q.includes('email') || q.includes('reach') || q.includes('hire') || q.includes('linkedin')) {
        return '📬 **Contact Aren:**\n• Email: aren.saty@gmail.com\n• LinkedIn: linkedin.com/in/aren-satpathy-84793897\n• Location: Bengaluru, India';
    }
    if (q.includes('location') || q.includes('city') || q.includes('where') || q.includes('live') || q.includes('bengaluru') || q.includes('bangalore')) {
        return '📍 Aren is based in **Bengaluru, India**.';
    }
    if (q.includes('language') && (q.includes('speak') || q.includes('know') || q.includes('spoken') || !q.includes('programming'))) {
        return '🗣️ Aren speaks **English, Hindi, and Odia**.';
    }

    // === Greetings & Meta ===
    if (/^(hello|hi|hey|hii|yo|sup)\b/.test(q)) {
        return '👋 Hello! I can answer questions about **Aren** (skills, experience, education, projects) or **any general topic** — tech, programming, science, etc. What would you like to know?';
    }
    if (q.includes('who are you') || q.includes('what are you') || q.includes('what can you do')) {
        return '🤖 I\'m an AI assistant on Aren\'s portfolio. I can answer questions about **Aren** or **any general topic**. Try asking "Who is Aren?" or "What is Docker?"';
    }
    if (q.includes('thank')) {
        return '😊 You\'re welcome! Feel free to ask anything else.';
    }
    if (q.includes('bye') || q.includes('goodbye')) {
        return '👋 Goodbye! Have a great day!';
    }

    // === General Tech Topics ===

    // C language — word-boundary match to avoid false positives
    if (isAbout('c programming') || isAbout('c language') ||
        (/\b(what|explain|describe|define|tell|about)\b/.test(q) && /\bc\b/.test(q) && !q.includes('c++') && !q.includes('c#') && !q.includes('objective-c'))) {
        return '⚙️ **C** is a general-purpose, procedural programming language developed by Dennis Ritchie at Bell Labs in 1972. It provides low-level memory access, efficient performance, and is widely used for operating systems (Linux kernel), embedded systems, compilers, and system-level programming. C is the foundation for many modern languages including C++, C#, Java, and Go.';
    }
    if (isAbout('c++') || isAbout('cpp')) {
        return '⚡ **C++** is a high-performance language created by Bjarne Stroustrup in 1979 as an extension of C. Supports OOP, templates, STL, RAII, and low-level memory control. Used for game engines (Unreal), embedded systems, real-time apps, browsers, and system software.';
    }
    if (isAbout('c#') || isAbout('c sharp') || isAbout('csharp')) {
        return '🎯 **C#** (C-Sharp) is a modern, object-oriented language by Microsoft for the .NET framework. Used for Windows apps, game dev (Unity), web APIs (ASP.NET), and enterprise software. Features garbage collection, LINQ, async/await, and strong typing.';
    }
    if (isAbout('python')) {
        return '🐍 **Python** is a high-level, interpreted language known for readability and versatility. Created by Guido van Rossum in 1991. Used in web dev (Django, Flask), data science (Pandas, NumPy), AI/ML (TensorFlow, PyTorch), automation, and scripting.';
    }
    if (isAbout('java') && !q.includes('javascript')) {
        return '☕ **Java** is a class-based, object-oriented language designed for portability ("write once, run anywhere"). Used in enterprise apps (Spring Boot), Android development, distributed systems, and big data (Hadoop). Features JVM, garbage collection, and strong typing.';
    }
    if (isAbout('javascript') || (isAbout('js') && !q.includes('node'))) {
        return '💛 **JavaScript** is the most popular web development language. Runs in browsers and servers (Node.js). Supports event-driven, functional, and OOP styles. Powers interactive websites, APIs, mobile apps (React Native), and desktop apps (Electron).';
    }
    if (isAbout('typescript')) {
        return '🔷 **TypeScript** is a strongly-typed superset of JavaScript by Microsoft. Adds static type checking, interfaces, generics, and enums. Compiles to JavaScript and is widely used with Angular, React, and Node.js.';
    }
    if (isAbout('rust')) {
        return '🦀 **Rust** is a systems programming language focused on safety, speed, and concurrency. Features ownership model (no garbage collector), zero-cost abstractions, and memory safety guarantees. Used for OS kernels, WebAssembly, CLI tools, and game engines.';
    }
    if (isAbout('go') || isAbout('golang')) {
        return '🐹 **Go** (Golang) is a statically-typed language by Google. Known for simplicity, fast compilation, built-in concurrency (goroutines), and an excellent standard library. Used for cloud infrastructure (Docker, Kubernetes), APIs, and microservices.';
    }
    if (isAbout('swift')) {
        return '🍎 **Swift** is Apple\'s modern language for iOS, macOS, watchOS, and tvOS development. Features type safety, optionals, closures, protocol-oriented programming, and automatic memory management (ARC).';
    }
    if (isAbout('kotlin')) {
        return '🟣 **Kotlin** is a modern, concise language by JetBrains, fully interoperable with Java. Official language for Android development. Features null safety, coroutines, extension functions, data classes, and smart casts.';
    }
    if (isAbout('ruby')) {
        return '💎 **Ruby** is a dynamic, object-oriented language designed for developer happiness. Known for **Ruby on Rails** web framework. Features blocks, mixins, duck typing, and elegant syntax focused on productivity.';
    }
    if (isAbout('php')) {
        return '🐘 **PHP** is a server-side scripting language for web development. Powers ~77% of websites including WordPress, Laravel, and Drupal. Features easy database integration and a large ecosystem.';
    }
    if (isAbout('html')) {
        return '📄 **HTML** (HyperText Markup Language) is the standard markup language for web pages. Defines structure using elements like headings, paragraphs, links, images, forms, and semantic tags (header, nav, article, footer).';
    }
    if (isAbout('css')) {
        return '🎨 **CSS** (Cascading Style Sheets) controls visual presentation of HTML — layouts, colors, fonts, spacing, animations, and responsive design. Modern CSS includes Flexbox, Grid, custom properties, and media queries.';
    }
    if (isAbout('node') || isAbout('nodejs') || isAbout('node.js')) {
        return '🟢 **Node.js** is a JavaScript runtime built on Chrome\'s V8 engine for server-side programming. Features non-blocking I/O, event-driven architecture, npm, and is used for APIs, real-time apps, and microservices.';
    }
    if (isAbout('react')) {
        return '⚛️ **React** is a JavaScript library by Meta for building UIs with reusable components, virtual DOM, and JSX. Ecosystem includes React Router, Redux/Zustand, Next.js, and React Native for mobile.';
    }
    if (isAbout('angular')) {
        return '🅰️ **Angular** is a TypeScript-based web framework by Google. Features component architecture, dependency injection, RxJS, two-way data binding, CLI tools, and built-in routing/forms/HTTP modules.';
    }
    if (isAbout('vue') || isAbout('vuejs')) {
        return '🟩 **Vue.js** is a progressive JavaScript framework for UIs. Features reactive data binding, component system, Vue Router, Pinia state management, and a gentle learning curve.';
    }
    if (isAbout('next') || isAbout('nextjs') || isAbout('next.js')) {
        return '▲ **Next.js** is a React framework by Vercel for production-grade web apps. Features server-side rendering (SSR), static site generation (SSG), API routes, file-based routing, image optimization, and edge functions.';
    }
    if (isAbout('docker') && !q.includes('aren')) {
        return '🐳 **Docker** containerizes applications with dependencies into portable containers. Key concepts: Dockerfile, images, containers, volumes, docker-compose, and registries (Docker Hub).';
    }
    if (isAbout('kubernetes') || isAbout('k8s')) {
        return '☸️ **Kubernetes** (K8s) is an open-source container orchestration platform by Google. Manages containerized workloads with auto-scaling, self-healing, service discovery, load balancing, and rolling updates.';
    }
    if (isAbout('aws')) {
        return '☁️ **AWS** (Amazon Web Services) is the leading cloud platform with 200+ services: EC2 (compute), S3 (storage), Lambda (serverless), RDS (databases), CloudFront (CDN), EKS (Kubernetes), and IAM (security).';
    }
    if (isAbout('azure devops') || isAbout('azure cloud')) {
        return '☁️ **Microsoft Azure** is a cloud platform offering Virtual Machines, App Service, Azure Functions, Cosmos DB, Azure DevOps, and AKS. Integrates well with .NET and Microsoft ecosystem.';
    }
    if (isAbout('gcp') || isAbout('google cloud')) {
        return '☁️ **Google Cloud Platform (GCP)** offers Compute Engine, Cloud Storage, BigQuery, Cloud Functions, GKE, and AI/ML tools (Vertex AI). Known for data analytics and ML capabilities.';
    }
    if (isAbout('git') && !q.includes('github') && !q.includes('gitlab')) {
        return '📦 **Git** is a distributed version control system by Linus Torvalds. Key concepts: repos, branches, commits, merging, rebasing, pull requests. Commands: `git init`, `git add`, `git commit`, `git push`, `git merge`.';
    }
    if (isAbout('github')) {
        return '🐙 **GitHub** is a web platform for Git version control and collaboration. Features: repos, pull requests, issues, Actions (CI/CD), Pages (hosting), Copilot (AI), code review, and project management. Owned by Microsoft.';
    }
    if (isAbout('gitlab')) {
        return '🦊 **GitLab** is a DevOps platform with Git repository management, CI/CD pipelines, issue tracking, container registry, and security scanning in a single application.';
    }
    if (isAbout('linux') && !q.includes('aren')) {
        return '🐧 **Linux** is an open-source OS kernel by Linus Torvalds (1991). Powers servers, cloud, embedded systems, and Android. Popular distros: Ubuntu, Fedora, CentOS, Arch, Debian.';
    }
    if (isAbout('sql') || isAbout('database')) {
        return '🗄️ **SQL** (Structured Query Language) manages relational databases. Operations: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN`, `GROUP BY`. Popular DBs: MySQL, PostgreSQL, SQLite, Oracle, SQL Server.';
    }
    if (isAbout('nosql') || isAbout('mongodb') || isAbout('mongo')) {
        return '🍃 **NoSQL** databases store data in non-tabular formats — document (MongoDB), key-value (Redis), column-family (Cassandra), or graph (Neo4j). Designed for scalability and unstructured data.';
    }
    if (isAbout('redis')) {
        return '🔴 **Redis** is an in-memory data structure store used as a database, cache, message broker, and queue. Supports strings, hashes, lists, sets, sorted sets, streams, and pub/sub. Known for sub-millisecond latency.';
    }
    if (isAbout('api') || isAbout('rest') || isAbout('restful')) {
        return '🔗 **API** (Application Programming Interface) allows systems to communicate. **REST** APIs use HTTP methods (GET, POST, PUT, DELETE) with JSON. Other styles: GraphQL, gRPC, WebSocket, SOAP.';
    }
    if (isAbout('graphql')) {
        return '◆ **GraphQL** is a query language for APIs by Meta. Clients request exactly the data they need from a single endpoint. Features typed schema, subscriptions, and introspection.';
    }
    if (isAbout('machine learning') || isAbout('ml') || isAbout('artificial intelligence') || (isAbout('ai') && !q.includes('aren'))) {
        return '🤖 **Machine Learning (ML)** is a subset of AI where systems learn from data. Types: supervised (classification, regression), unsupervised (clustering), reinforcement learning. Tools: TensorFlow, PyTorch, scikit-learn.';
    }
    if (isAbout('data structure')) {
        return '📊 **Data Structures** organize and store data efficiently. Types: Arrays, Linked Lists, Stacks, Queues, Trees (BST, AVL), Heaps, Hash Tables, Graphs. Choice depends on operations needed and time complexity.';
    }
    if (isAbout('algorithm')) {
        return '🧮 **Algorithms** are step-by-step procedures for solving problems. Categories: sorting (quicksort, mergesort), searching (binary search), graph (BFS, DFS, Dijkstra), dynamic programming, greedy, divide & conquer.';
    }
    if (isAbout('devops')) {
        return '🔄 **DevOps** combines development and operations for faster software delivery. Practices: CI/CD, infrastructure as code, monitoring, containerization. Tools: Jenkins, Docker, Kubernetes, Terraform, GitHub Actions.';
    }
    if (isAbout('ci/cd') || isAbout('ci cd') || isAbout('continuous integration')) {
        return '🔄 **CI/CD** (Continuous Integration / Continuous Deployment) automates building, testing, and deploying code. Tools: Jenkins, GitHub Actions, GitLab CI, CircleCI, Azure Pipelines.';
    }
    if (isAbout('jenkins')) {
        return '🔧 **Jenkins** is an open-source automation server for CI/CD pipelines. Features Jenkinsfile (pipeline-as-code), 1800+ plugins, distributed builds, and integration with Git, Docker, and Kubernetes.';
    }
    if (isAbout('terraform')) {
        return '🏗️ **Terraform** by HashiCorp is an Infrastructure as Code (IaC) tool using HCL to define and provision cloud infrastructure across AWS, Azure, GCP declaratively.';
    }
    if (isAbout('agile') || isAbout('scrum')) {
        return '🏃 **Agile** is an iterative development methodology. **Scrum** is an Agile framework with sprints (2-4 weeks), daily standups, sprint reviews, and retrospectives. Roles: Product Owner, Scrum Master, Dev Team.';
    }
    if (isAbout('websocket')) {
        return '🔌 **WebSocket** provides full-duplex, persistent connections between client and server. Unlike HTTP, both sides can send data anytime. Used for real-time apps: chat, gaming, live feeds, streaming.';
    }
    if (isAbout('embedded system') || isAbout('embedded programming')) {
        return '🔧 **Embedded Systems** are specialized computers for specific functions. Programmed in C/C++, they operate with real-time constraints and interface with hardware (sensors, actuators). Examples: automotive ECUs, IoT devices.';
    }
    if (isAbout('multithreading') || isAbout('multi-threading') || isAbout('concurrency')) {
        return '🧵 **Multithreading** enables concurrent thread execution within a process. Key concepts: mutexes, semaphores, deadlocks, race conditions, thread pools, atomic operations. Used for parallelism and responsive systems.';
    }
    if (isAbout('operating system') || (isAbout('os') && q.length < 30)) {
        return '💻 **Operating Systems** manage hardware and provide services to apps. Concepts: process management, memory management (virtual memory, paging), file systems, scheduling, I/O management, IPC. Examples: Linux, Windows, macOS.';
    }
    if (isAbout('oops') || isAbout('object oriented') || isAbout('oop')) {
        return '🏛️ **Object-Oriented Programming (OOP)** organizes code into objects. Four pillars: **Encapsulation** (data hiding), **Abstraction** (hiding complexity), **Inheritance** (code reuse), **Polymorphism** (many forms). Used in C++, Java, Python, C#.';
    }
    if (isAbout('stl') || isAbout('standard template library')) {
        return '📚 **STL** (Standard Template Library) is a C++ library providing generic containers (vector, map, set, deque), algorithms (sort, search, transform), and iterators. Enables efficient, reusable, type-safe data structures.';
    }
    if (isAbout('sdlc') || isAbout('software development life cycle')) {
        return '📋 **SDLC** (Software Development Life Cycle) is the process of planning, creating, testing, and deploying software. Phases: requirements, design, implementation, testing, deployment, maintenance. Models: Waterfall, Agile, V-Model, Spiral.';
    }
    if (isAbout('wireshark')) {
        return '🦈 **Wireshark** is an open-source network protocol analyzer for troubleshooting, analysis, and development. Captures and inspects network packets in real-time with powerful filtering, color-coding, and protocol decoding.';
    }
    if (isAbout('jira')) {
        return '📋 **Jira** by Atlassian is a project management tool for agile teams. Features: issue tracking, sprint planning, Kanban/Scrum boards, workflows, dashboards, and integrations with development tools.';
    }

    // === Fallback ===
    return 'I don\'t have an offline answer for that specific topic. I can answer questions about **Aren** (skills, experience, education, projects, contact) or **general tech topics**.\n\nTry:\n• "Who is Aren?"\n• "What is his experience?"\n• "What is Docker?"\n• "Explain Python"\n• "What is C?"\n\n💡 **Tip:** Set up a Gemini API key for unlimited answers on any topic!';
}

// Expose globally
window.getLocalAnswer = getLocalAnswer;
