// ============================================================
// CONTENT DATA — edit this file to update the site.
// No code changes needed: main.js renders everything below.
// ============================================================

export const missions = [
  {
    code: 'MSN-01',
    title: 'Meridian AI Engine',
    dates: 'JUN 2026 — PRESENT',
    org: 'Meridian Knowledge Solutions',
    cat: 'AI',
    featured: true,
    desc: 'AI platform powering an enterprise LMS: natural-language reporting that turns plain-English questions into live charts, an AI course-authoring studio, an in-app assistant with smart page navigation, and composable analytics dashboards.',
    tags: ['Python', 'AWS Bedrock', 'pgvector', 'Vue.js', '.NET'],
  },
  {
    code: 'MSN-02',
    title: 'MG Mobile App',
    dates: 'NOV 2025 — PRESENT',
    org: 'Meridian Knowledge Solutions',
    cat: 'SOFTWARE',
    featured: true,
    desc: 'Multi-platform learning app built on .NET MAUI, shipping from a single codebase to Android, iOS, and WinUI.',
    tags: ['.NET MAUI', 'C#', 'Android', 'iOS', 'WinUI'],
  },
  {
    code: 'MSN-03',
    title: 'AI MG Help',
    dates: 'SEP 2025 — OCT 2025',
    org: 'Meridian Knowledge Solutions',
    cat: 'AI',
    featured: false,
    desc: 'Full AI help chatbot: an agent crawls and indexes help documentation into a vector database on startup, then answers questions with retrieval-augmented generation — designed to operate in a secure environment.',
    tags: ['AI / RAG', 'Python', 'Vector DB', 'GPT'],
  },
  {
    code: 'MSN-04',
    title: 'Touchstone',
    dates: 'JUL 2026 — PRESENT',
    org: 'Independent tooling',
    cat: 'SOFTWARE',
    featured: false,
    desc: 'Code-quality scanner suite for a large enterprise codebase — localization coverage analysis across thousands of resource strings, plus dead-surface and hardcoded-text detection.',
    tags: ['Static analysis', 'Python', 'Code quality'],
  },
  {
    code: 'MSN-05',
    title: 'HSA Servers',
    dates: 'DEC 2024 — MAY 2025',
    org: 'Infrastructure',
    cat: 'OPS',
    featured: false,
    desc: 'Managing, maintaining, and troubleshooting Windows Server infrastructure.',
    tags: ['Windows Server', 'PowerShell', 'Ops'],
  },
  {
    code: 'MSN-06',
    title: 'DayZ Game Servers',
    dates: 'JUN 2021 — NOV 2021',
    org: 'Founder / operator',
    cat: 'OPS',
    featured: true,
    desc: 'Owned and operated a 7,000-member DayZ gaming community running on servers I built — including custom gameplay modules and 3D-modeled content for the server.',
    tags: ['Game servers', 'Community ops', '3D modeling', 'Modding'],
  },
  {
    code: 'MSN-07',
    title: 'Aqua & Astros',
    dates: 'MAY 2020 — AUG 2020',
    org: 'Fidelity Investments',
    cat: 'SOFTWARE',
    featured: false,
    desc: 'Landing pages for two squads within Fidelity’s Enterprise Infrastructure — Vue.js frontends over REST APIs and MongoDB, delivered through the FEI Agile process.',
    tags: ['Vue.js', 'REST API', 'MongoDB', 'Agile'],
  },
  {
    code: 'MSN-08',
    title: 'Nemeth Braille Translator',
    dates: 'JAN 2020 — MAY 2020',
    org: 'University of North Texas',
    cat: 'SOFTWARE',
    featured: true,
    desc: 'Accessibility app that translates braille to readable text on hover — built in Python for the Android platform.',
    tags: ['Python', 'Android', 'Accessibility', 'Computer vision'],
  },
  {
    code: 'MSN-09',
    title: 'Restaurant Portal',
    dates: 'JAN 2020 — MAY 2020',
    org: 'University of North Texas',
    cat: 'SOFTWARE',
    featured: false,
    desc: 'Complete restaurant platform covering payment, ordering, inventory management, and order tracking — with role-based access levels for managers, waitstaff, kitchen staff, and customers.',
    tags: ['Full-stack', 'Payments', 'RBAC'],
  },
  {
    code: 'MSN-10',
    title: 'Project MEGALO',
    dates: 'FEB 2020 — MAR 2020',
    org: 'UNT Makerspace',
    cat: 'HARDWARE',
    featured: true,
    desc: 'Designed and built the largest 3D printer in DFW — a 1m × 1m × 1m build volume — solo, in one month, on a $400 budget.',
    tags: ['Hardware', 'CAD', '3D printing', 'Fabrication'],
  },
  {
    code: 'MSN-11',
    title: 'Airline Flight Scheduler',
    dates: 'AUG 2019 — DEC 2019',
    org: 'University of North Texas',
    cat: 'AI',
    featured: true,
    desc: 'Python system that uses machine learning to schedule flights around peak demand — also rostering pilots and crew, and tracking vacations, aircraft maintenance schedules, and AMT records.',
    tags: ['Python', 'Machine learning', 'Scheduling', 'Aviation'],
  },
  {
    code: 'MSN-12',
    title: 'LifeAlert++',
    dates: 'APR 2019',
    org: 'University of North Texas',
    cat: 'HARDWARE',
    featured: false,
    desc: 'Emergency-response system: a wearable pendant that notifies 911 with the patient’s allergies, conditions, doctors, and emergency contacts — while streaming live patient data to emergency services.',
    tags: ['IoT', 'Embedded', 'Health tech'],
  },
];

export const experience = [
  {
    role: 'Application Developer II',
    org: 'Meridian Knowledge Solutions',
    dates: 'FEB 2022 — PRESENT',
    bullets: [
      'Full software lifecycle on an enterprise learning platform — defining, designing, implementing, shipping, maintaining.',
      '.NET development and cybersecurity SME; cross-functional work with Product, Design, and Ops.',
      'Automation, regression, and unit testing — building test suites and guaranteeing customer use cases.',
    ],
  },
  {
    role: 'Systems Engineer',
    org: 'Fidelity Investments',
    dates: 'MAR 2020 — AUG 2020',
    bullets: [
      'Developed and tested systems for Enterprise Infrastructure: Vue.js UX, Swagger/REST API development.',
      'Agile & Scrum delivery; cloud deployments; Jira + ServiceNow workflows.',
    ],
  },
  {
    role: 'Makerspace Specialist',
    org: 'University of North Texas',
    dates: 'MAY 2019 — DEC 2021',
    bullets: [
      'Ran workshops on 3D printing/scanning, laser cutting, CNC and PCB milling, microcontrollers, and A/V.',
      'Built training curriculums for staff and students; collaborated with an 18-member international team.',
    ],
  },
  {
    role: 'Lead IT Technician',
    org: 'UNT Library',
    dates: 'MAY 2018 — AUG 2019',
    bullets: [
      'Managed a 5-floor computer lab and led a 22-member team; ~300 students assisted daily.',
      'Secured the library’s central servers; networking and troubleshooting across Mac and PC fleets.',
    ],
  },
  {
    role: 'IT Desk Customer Service Rep',
    org: 'UNT Library',
    dates: 'JUL 2016 — JUL 2019',
    bullets: [
      'Frontline support: printers, scanners, lab computers, networks, Office and Adobe suites.',
    ],
  },
];

export const skillGroups = [
  { name: 'LANGUAGES', items: ['C', 'C++', 'C#', 'Java', 'JavaScript', 'Python', 'SQL', 'PHP', 'R', 'Assembly', 'Bash / Shell'] },
  { name: 'WEB & APP', items: ['Vue.js', '.NET / MAUI', 'REST APIs', 'HTML / CSS', 'Selenium'] },
  { name: 'CLOUD & INFRA', items: ['AWS', 'Azure', 'Windows Server', 'PowerShell', 'Git / GitHub'] },
  { name: 'SECURITY', items: ['Penetration testing', 'Nmap', 'Kali Linux', 'Hak5 tooling', 'Security analysis'] },
  { name: 'DATA & ML', items: ['TensorFlow', 'Tableau', 'Vector DBs'] },
  { name: 'HARDWARE & FAB', items: ['Arduino', 'Raspberry Pi', '3D printing', 'CNC milling', 'PCB milling', 'Laser cutting', '3D scanning'] },
];

export const certs = [
  { name: 'Commercial Pilot — Instrument Rated', issuer: 'FAA', kind: 'RATING' },
  { name: 'IBM Cybersecurity Analyst', issuer: 'IBM', kind: 'SPECIALIZATION' },
  { name: 'Security Analyst Fundamentals', issuer: 'IBM', kind: 'SPECIALIZATION' },
  { name: 'IT Fundamentals for Cybersecurity', issuer: 'IBM', kind: 'SPECIALIZATION' },
];

export const education = [
  { school: 'University of North Texas', detail: 'B.S. — Computer Science & Cyber Security', dates: '2016 — 2021' },
  { school: 'US Aviation Academy', detail: 'Airline / Commercial / Professional Pilot & Flight Crew', dates: '2015 — 2016' },
  { school: 'University of Central Lancashire', detail: 'Diploma — Computer Software Engineering', dates: '2012 — 2015' },
];
