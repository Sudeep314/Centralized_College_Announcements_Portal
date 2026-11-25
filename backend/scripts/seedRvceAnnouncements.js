import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads dir exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generates a standard, valid PDF 1.4 document
 */
function generatePdf(title, subtitle, lines) {
  let stream = 'BT\n/F1 15 Tf\n50 730 Td\n(' + title.replace(/[\(\)]/g, '') + ') Tj\n';
  stream += '/F1 11 Tf\n0 -22 Td\n(' + subtitle.replace(/[\(\)]/g, '') + ') Tj\n';
  stream += '/F1 10 Tf\n0 -26 Td\n';
  
  lines.forEach((line) => {
    stream += '(' + line.replace(/[\(\)]/g, '') + ') Tj\n0 -16 Td\n';
  });
  stream += 'ET\n';

  const len = Buffer.byteLength(stream, 'utf8');
  let pdf = '%PDF-1.4\n';
  const offsets = [];

  offsets[1] = pdf.length;
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  offsets[2] = pdf.length;
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  offsets[3] = pdf.length;
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n';

  offsets[4] = pdf.length;
  pdf += '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  offsets[5] = pdf.length;
  pdf += `5 0 obj\n<< /Length ${len} >>\nstream\n${stream}endstream\nendobj\n`;

  const xrefOffset = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

/**
 * Generates an SVG poster image
 */
function generateSvgPoster(title, subtitle, badgeText, gradientColors, details) {
  const [c1, c2] = gradientColors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="800" height="450" fill="url(#grad)" rx="16"/>
  <rect x="40" y="40" width="720" height="370" fill="#ffffff" fill-opacity="0.08" rx="12" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.5"/>
  
  <rect x="60" y="65" width="140" height="32" rx="16" fill="#ffffff" fill-opacity="0.25"/>
  <text x="130" y="86" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1">${badgeText}</text>
  
  <text x="60" y="145" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" filter="url(#shadow)">${title}</text>
  <text x="60" y="185" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="500">${subtitle}</text>

  <line x1="60" y1="215" x2="740" y2="215" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1"/>

  <g transform="translate(60, 250)">
    ${details.map((d, i) => `
      <g transform="translate(${i * 230}, 0)">
        <rect width="210" height="110" rx="10" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.2"/>
        <text x="16" y="32" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" text-transform="uppercase">${d.label}</text>
        <text x="16" y="62" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="bold">${d.value}</text>
        <text x="16" y="88" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">${d.note || ''}</text>
      </g>
    `).join('')}
  </g>
</svg>`;
}

async function runSeed() {
  console.log('Generating authentic RVCE attachments in backend/uploads...');

  // 1. PDF: SEE Timetable
  const seePdf = generatePdf(
    'R.V. COLLEGE OF ENGINEERING (AUTONOMOUS)',
    'Office of the Controller of Examinations | Bengaluru - 560059',
    [
      'CIRCULAR: Semester End Examination (SEE) Timetable - 3rd & 4th Sem B.E. (CSE)',
      'Academic Year 2026 | Scheme: 2022/2024 Autonomous Curriculum',
      '---------------------------------------------------------------------------------',
      'Course Code   Subject Title                               Date         Session',
      '---------------------------------------------------------------------------------',
      'BMATC301      Maths for Computer Science & Engg          15-Dec-2026  Morning (09:30 AM - 12:30 PM)',
      'BCS302        Data Structures and Applications           18-Dec-2026  Morning (09:30 AM - 12:30 PM)',
      'BCS303        Digital Design & Computer Organization     22-Dec-2026  Morning (09:30 AM - 12:30 PM)',
      'BCS304        Operating Systems & Linux Kernel Lab       26-Dec-2026  Morning (09:30 AM - 12:30 PM)',
      'BCS305        Object Oriented Programming with Java      30-Dec-2026  Morning (09:30 AM - 12:30 PM)',
      '---------------------------------------------------------------------------------',
      'Instructions to Candidates:',
      '1. Hall tickets must be collected from CSE Department Office after clearing all dues.',
      '2. Scientific non-programmable calculators (fx-991ES Plus / ClassWiz) are permitted.',
      '3. Mobile phones, smartwatches, and programmable devices are strictly prohibited.',
      '4. Report to examination halls 20 minutes before commencement of the test.',
      'Issued by: Controller of Examinations, RVCE Bengaluru.'
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_SEE_Dec2026_CSE_Timetable.pdf'), seePdf);

  // 2. PDF: CIE-3 & Lab Exam Circular
  const labPdf = generatePdf(
    'R.V. COLLEGE OF ENGINEERING | DEPT OF CSE',
    'Internal Assessment & Laboratory SEE Examination Notice',
    [
      'To: All 2nd Year (3rd & 4th Sem) B.E. CSE Students',
      'Subject: CIE-3 Schedule & Practical Examination Guidelines',
      '---------------------------------------------------------------------------------',
      'Laboratory practical examinations will be held in Turing Lab & Hopper Lab (CSE 3rd Flr).',
      '- BCSL305: Data Structures Laboratory SEE Exams: 05-Dec-2026 to 08-Dec-2026',
      '- BCSL306: Microprocessors & Microcontrollers Lab: 09-Dec-2026 to 12-Dec-2026',
      'Batch-wise slots: Batch A1 (08:30 AM), Batch A2 (11:30 AM), Batch A3 (02:00 PM)',
      'Requirements: Verified laboratory observation book and signed lab record are mandatory.',
      'Contact: Prof. CSE Lab Coordinator, RVCE Bengaluru.'
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_CSE_CIE3_Lab_Exam_Circular.pdf'), labPdf);

  // 3. SVG Poster: CodeSprint Hackathon
  const hackPoster = generateSvgPoster(
    'CodeSprint 2026: 24-Hour Hackathon',
    'RVCE Coding Club & Department of Computer Science & Engineering',
    'CODING CLUB RVCE',
    ['#1e1b4b', '#4338ca'],
    [
      { label: 'Prize Pool', value: '₹50,000 Cash', note: 'Plus Internship Opportunities' },
      { label: 'Date & Venue', value: '12 - 13 Dec 2026', note: 'IEM Auditorium & CS Labs' },
      { label: 'Tracks', value: 'AI/ML, Web3, Cloud', note: 'Teams of 2 to 4 Students' }
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_CodeSprint_Hackathon_2026_Banner.svg'), hackPoster);

  // 4. PDF: Mini-Project Guidelines
  const projectPdf = generatePdf(
    'R.V. COLLEGE OF ENGINEERING | DEPT OF COMPUTER SCIENCE',
    '2nd Year B.E. Mini-Project Evaluation Framework (BCSP306)',
    [
      'Guidelines for 3rd/4th Semester CSE Students:',
      '1. Project Team Size: Maximum 3 students per team within CSE department.',
      '2. Deliverables: Fully functioning application, GitHub repository with clean commits,',
      '   and IEEE format 6-page project report.',
      '3. Evaluation Rubrics: Architecture & Code Quality (30%), Innovation (20%),',
      '   Demonstration & Viva (30%), Report Documentation (20%).',
      '4. Final Demonstration Dates: 10-Dec-2026 to 12-Dec-2026 in Computer Labs 1-4.',
      'Guide: Assigned Department Faculty Mentors | HOD, Dept of CSE RVCE.'
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_CSE_2ndYear_MiniProject_Rubrics.pdf'), projectPdf);

  // 5. PDF: NCC RVCE Camp Circular
  const nccPdf = generatePdf(
    '1 KAR BN NCC | RVCE COMPANY (ARMY WING)',
    'R.V. College of Engineering Unit | NCC Directorate Karnataka & Goa',
    [
      'NOTICE: Annual Training Camp (ATC-2026) Selection & Parade Preparation',
      '---------------------------------------------------------------------------------',
      'To: Registered NCC Senior Division (SD) and Senior Wing (SW) Cadets',
      'All 2nd Year B.E. cadets preparing for "B" Certificate examinations must report',
      'for rigorous drill sessions and weapon training as per schedule below:',
      '- Venue: RVCE Main Sports Ground',
      '- Timings: 06:00 AM - 08:30 AM (Tuesdays & Saturdays)',
      '- Mandatory Uniform: Proper Camouflage / Working Khakis, DMS boots, and Beret.',
      '- Camp Dates: 20-Dec-2026 to 29-Dec-2026 at Air Force Station Jalahalli.',
      'Authorized by: Associate NCC Officer (ANO), RVCE Coy, 1 KAR BN NCC.'
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_1KAR_BN_NCC_Cadet_Circular.pdf'), nccPdf);

  // 6. SVG Poster: NSS Blood Donation Drive
  const nssPoster = generateSvgPoster(
    'Annual Blood Donation & Health Drive 2026',
    'National Service Scheme (NSS) RVCE Unit in collaboration with Red Cross',
    'NSS RVCE UNIT',
    ['#881337', '#e11d48'],
    [
      { label: 'Event Date', value: 'Saturday, 05 Dec', note: '09:00 AM to 04:30 PM' },
      { label: 'Venue', value: 'RVCE Health Center', note: 'Opposite Cauvery Hostel' },
      { label: 'Recognition', value: 'Donor Certificate', note: 'Free Health Screening & Meal' }
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_NSS_Blood_Donation_Camp_2026.svg'), nssPoster);

  // 7. SVG Poster: ACM Docker Workshop
  const acmPoster = generateSvgPoster(
    'Hands-on DevOps: Docker & Kubernetes',
    'Joint Student Workshop by ACM Student Chapter & IEEE CS RVCE',
    'ACM & IEEE CS RVCE',
    ['#064e3b', '#059669'],
    [
      { label: 'Hands-on Labs', value: 'Containers & CI/CD', note: 'Bring Your Laptop (Linux/Win)' },
      { label: 'Date & Time', value: '06 Dec 2026, 10 AM', note: 'Sir M.V. Seminar Hall' },
      { label: 'Prerequisites', value: 'Basic Terminal / Git', note: 'Open to 2nd & 3rd Year CSE' }
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_ACM_Docker_Kubernetes_HandsOn.svg'), acmPoster);

  // 8. PDF: Remedial Classes Mathematics
  const mathsPdf = generatePdf(
    'R.V. COLLEGE OF ENGINEERING | DEPT OF MATHEMATICS',
    'Special FastTrack Remedial Classes - Mathematics for CSE (BMATC301)',
    [
      'Target: 2nd Year B.E. (CSE, ISE, AIML) students registered for BMATC301',
      'Subjects covered: Fourier Transforms, Z-Transforms, Numerical Methods & Graph Theory',
      'Timetable:',
      '- Mondays & Wednesdays: 05:00 PM - 06:30 PM (Classroom CS-201)',
      '- Saturdays: 02:00 PM - 04:30 PM (Problem-Solving & Previous Question Papers)',
      'Attendance in remedial sessions will count towards CIE eligibility condonation.',
      'Faculty in-charge: Dr. Mathematics Department | Academic Dean, RVCE.'
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_Remedial_Classes_BMATC301.pdf'), mathsPdf);

  // 9. PDF: CoE Exam Hall Ticket & Instructions
  const rulesPdf = generatePdf(
    'R.V. COLLEGE OF ENGINEERING | CONTROLLER OF EXAMINATIONS',
    'Advisory on Hall Ticket Issuance, Malpractice Rules & Autonomous SEE Protocol',
    [
      'OFFICIAL MEMORANDUM TO ALL B.E. STUDENTS (AUTONOMOUS SCHEME)',
      '1. Hall tickets will be downloadable via the RVCE Student Portal (SAP/Contineo) from 08-Dec-2026.',
      '2. Physical signature and seal from the Head of the Department (CSE) is compulsory.',
      '3. Candidates found in possession of unauthorized materials or digital watches will be booked',
      '   under Autonomous Examination Malpractice Code Section 4.2 with debarment.',
      '4. Strict dress code: College Identity Card hanging around the neck is compulsory throughout.',
      'Registrar (Evaluation), R.V. College of Engineering, Mysuru Road, Bengaluru.'
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_CoE_Exam_HallTicket_Instructions.pdf'), rulesPdf);

  // 10. PDF: Central Library Hours
  const libPdf = generatePdf(
    'R.V. COLLEGE OF ENGINEERING | CENTRAL LIBRARY & INFORMATION CENTRE',
    'Extended Reading Room Timings During Semester End Examination Period',
    [
      'Notice to All Undergraduates & Research Scholars:',
      'To facilitate student exam preparation, Central Library hours are revised as follows:',
      '- Working Days & Saturdays: 08:00 AM to 11:30 PM',
      '- Sundays & General Holidays: 09:00 AM to 08:00 PM',
      '- Air-conditioned Reference Section & Wi-Fi Digital Library remain open.',
      '- Return of book bank textbooks without late fine extended up to 20-Dec-2026.',
      'Chief Librarian, RVCE Central Library, Dr. M. S. Ramaiah Block.'
    ]
  );
  fs.writeFileSync(path.join(uploadsDir, 'RVCE_Library_Extended_Night_Hours.pdf'), libPdf);

  console.log('All 10 attachments written to backend/uploads successfully.');

  // Login as admin
  console.log('Authenticating with backend at http://localhost:5000/api/auth/login...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data?.token;

  if (!token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginJson));
  }
  console.log('Admin login verified. Token received.');

  // Announcements array specifically designed for 2nd Year CSE RVCE Bengaluru
  const announcementsToCreate = [
    {
      title: 'RVCE Autonomous SEE Timetable: 3rd & 4th Sem B.E. (CSE Scheme 2022/24)',
      category: 'Examinations',
      description: 'The Office of the Controller of Examinations (CoE) has officially published the Semester End Examination (SEE) theory timetable for 2nd Year B.E. (Computer Science & Engineering). Theory examinations commence on December 15, 2026, with Mathematics for CSE (BMATC301) followed by Data Structures, Digital Design & Computer Organization, Operating Systems, and Java Programming. Check the attached circular for complete dates and exam hall regulations.',
      pinned: true,
      deadline: '2026-12-15T04:00:00.000Z',
      publishedAt: '2026-11-25T14:30:00.000Z',
      sourceUrl: 'https://rvce.edu.in/controller-of-examinations',
      files: [
        {
          url: '/uploads/RVCE_SEE_Dec2026_CSE_Timetable.pdf',
          name: 'RVCE_SEE_Dec2026_CSE_Timetable.pdf',
          isImage: false,
          size: 1540,
        },
      ],
      links: [
        { label: 'RVCE CoE Examination Portal', url: 'https://rvce.edu.in/examination-section' },
        { label: 'VTU Autonomous Regulations 2024', url: 'https://rvce.edu.in/academics/regulations' },
      ],
    },
    {
      title: 'Dept of CSE: CIE-3 Schedule & Data Structures Lab Exam Batch Allocations',
      category: 'Examinations',
      description: 'Department of Computer Science & Engineering notification for 2nd Year B.E. students: Continuous Internal Evaluation 3 (CIE-3) and practical laboratory examinations for Data Structures Lab (BCSL305) and Microprocessors Lab will take place from December 5 to December 12, 2026. All students must present their certified lab observation books and completed records during their allotted slot.',
      pinned: false,
      deadline: '2026-12-05T03:30:00.000Z',
      publishedAt: '2026-11-25T11:00:00.000Z',
      sourceUrl: 'https://rvce.edu.in/dept-cse',
      files: [
        {
          url: '/uploads/RVCE_CSE_CIE3_Lab_Exam_Circular.pdf',
          name: 'RVCE_CSE_CIE3_Lab_Exam_Circular.pdf',
          isImage: false,
          size: 1024,
        },
      ],
      links: [
        { label: 'Lab Batch Slot Assignment Sheet', url: 'https://rvce.edu.in/cse/lab-batches-2026' },
      ],
    },
    {
      title: 'RVCE Coding Club: "CodeSprint 2026" 24-Hour Inter-Department Hackathon',
      category: 'Events',
      description: 'Calling all student programmers and innovators! The RVCE Coding Club, in collaboration with the CSE Department, presents "CodeSprint 2026", an intense 24-hour hackathon scheduled for December 12-13, 2026. Compete for ₹50,000 in cash prizes, direct internship shortlists with top tech sponsors, and showcase projects in AI/ML, Cloud Systems, and Web3. Open to teams of 2-4 students.',
      pinned: true,
      deadline: '2026-12-10T18:29:00.000Z',
      publishedAt: '2026-11-25T09:00:00.000Z',
      sourceUrl: 'https://codingclub.rvce.edu.in',
      files: [
        {
          url: '/uploads/RVCE_CodeSprint_Hackathon_2026_Banner.svg',
          name: 'RVCE_CodeSprint_Hackathon_2026_Banner.svg',
          isImage: true,
          size: 2180,
        },
      ],
      links: [
        { label: 'CodeSprint Registration Portal (Devfolio)', url: 'https://codesprint2026.devfolio.co' },
        { label: 'RVCE Coding Club Discord Community', url: 'https://discord.gg/rvcecoding' },
      ],
    },
    {
      title: 'Dept of CSE: 2nd Year Mini-Project (BCSP306) Submission & Rubrics',
      category: 'Academics',
      description: 'Formal announcement for 3rd and 4th Semester B.E. Computer Science students regarding course BCSP306: Mini-Project in Computing. Evaluation will be conducted based on GitHub repository commit consistency, architecture demonstration, and IEEE conference paper format project report. Final panel presentations will occur between December 10 and 12, 2026.',
      pinned: false,
      deadline: '2026-12-10T11:30:00.000Z',
      publishedAt: '2026-11-24T16:00:00.000Z',
      sourceUrl: 'https://rvce.edu.in/cse/mini-projects',
      files: [
        {
          url: '/uploads/RVCE_CSE_2ndYear_MiniProject_Rubrics.pdf',
          name: 'RVCE_CSE_2ndYear_MiniProject_Rubrics.pdf',
          isImage: false,
          size: 1120,
        },
      ],
      links: [
        { label: 'GitHub Classroom Submission Portal', url: 'https://classroom.github.com/a/rvce-cse-2026' },
        { label: 'IEEE Two-Column Report Template', url: 'https://www.ieee.org/conferences/publishing/templates.html' },
      ],
    },
    {
      title: '1 KAR BN NCC (RVCE Coy): Annual Training Camp (ATC) Selection & Drill Notice',
      category: 'Events',
      description: 'Attention all enrolled Senior Division (SD) and Senior Wing (SW) NCC Cadets at R.V. College of Engineering: Selection and mandatory morning drill practice for the upcoming 10-day Combined Annual Training Camp (ATC-2026) has commenced at the RVCE Sports Ground. Cadets preparing for "B" and "C" certificate exams must maintain 100% attendance.',
      pinned: false,
      deadline: '2026-12-04T02:30:00.000Z',
      publishedAt: '2026-11-24T13:00:00.000Z',
      sourceUrl: 'https://rvce.edu.in/campus-life/ncc',
      files: [
        {
          url: '/uploads/RVCE_1KAR_BN_NCC_Cadet_Circular.pdf',
          name: 'RVCE_1KAR_BN_NCC_Cadet_Circular.pdf',
          isImage: false,
          size: 1240,
        },
      ],
      links: [
        { label: 'NCC Directorate Karnataka & Goa', url: 'https://indiancc.nic.in' },
      ],
    },
    {
      title: 'NSS RVCE Unit: Campus Mega Blood Donation Drive & Free Health Camp',
      category: 'General',
      description: 'The National Service Scheme (NSS) RVCE Unit, in association with the Indian Red Cross Society and Rashtrotthana Blood Centre, is organizing the Annual Campus Blood Donation Drive at the RVCE Health Centre (opposite Cauvery Hostel) on Saturday, December 5, 2026. All healthy eligible students and staff are encouraged to participate. Refreshments and certificates will be distributed to all donors.',
      pinned: false,
      deadline: '2026-12-05T10:30:00.000Z',
      publishedAt: '2026-11-24T10:00:00.000Z',
      sourceUrl: 'https://rvce.edu.in/campus-life/nss',
      files: [
        {
          url: '/uploads/RVCE_NSS_Blood_Donation_Camp_2026.svg',
          name: 'RVCE_NSS_Blood_Donation_Camp_2026.svg',
          isImage: true,
          size: 2210,
        },
      ],
      links: [
        { label: 'Donor Pre-Registration Google Form', url: 'https://forms.gle/rvceNssBloodDrive2026' },
      ],
    },
    {
      title: 'ACM & IEEE CS RVCE: Hands-on Workshop on Docker, Microservices & CI/CD',
      category: 'Events',
      description: 'Enhance your backend and software development skills ahead of placements and projects! ACM Student Chapter and IEEE Computer Society RVCE are hosting a weekend hands-on bootcamp on Docker containerization, container networking, and automated GitHub Actions CI/CD pipelines. Bring your laptops with Docker Desktop installed.',
      pinned: false,
      deadline: '2026-12-06T04:30:00.000Z',
      publishedAt: '2026-11-23T15:00:00.000Z',
      sourceUrl: 'https://rvce.acm.org',
      files: [
        {
          url: '/uploads/RVCE_ACM_Docker_Kubernetes_HandsOn.svg',
          name: 'RVCE_ACM_Docker_Kubernetes_HandsOn.svg',
          isImage: true,
          size: 2190,
        },
      ],
      links: [
        { label: 'Workshop RSVP & Lab Materials', url: 'https://rvce.acm.org/workshops/devops2026' },
        { label: 'Docker Lab Setup Guide', url: 'https://docs.docker.com/get-started' },
      ],
    },
    {
      title: 'Dept of Mathematics: Remedial Sessions for Mathematics for CSE (BMATC301)',
      category: 'Academics',
      description: 'Department of Mathematics advisory for 2nd Year B.E. (Computer Science & allied branches): Intensive remedial and problem-solving classes are being conducted for BMATC301 (Transform Calculus, Linear Algebra, and Numerical Techniques) ahead of the SEE. Classes focus on previous VTU/RVCE autonomous question papers and core conceptual drills in CS-201.',
      pinned: false,
      deadline: '2026-12-14T11:30:00.000Z',
      publishedAt: '2026-11-23T11:00:00.000Z',
      sourceUrl: 'https://rvce.edu.in/dept-mathematics',
      files: [
        {
          url: '/uploads/RVCE_Remedial_Classes_BMATC301.pdf',
          name: 'RVCE_Remedial_Classes_BMATC301.pdf',
          isImage: false,
          size: 980,
        },
      ],
      links: [
        { label: 'Question Bank & Lecture Notes Repository', url: 'https://rvce.edu.in/maths/cse-study-materials' },
      ],
    },
    {
      title: 'Office of CoE: Hall Ticket Issuance Protocol & Code of Conduct for SEE 2026',
      category: 'Examinations',
      description: 'Crucial instructions from the Controller of Examinations: Hall tickets for the Semester End Examinations (SEE) will be enabled on the RVCE SAP/ERP student portal on December 8, 2026. Students must verify their course registrations, obtain the HOD seal, carry their official RVCE identity cards, and adhere strictly to autonomous examination code of conduct.',
      pinned: false,
      deadline: '2026-12-08T11:30:00.000Z',
      publishedAt: '2026-11-22T14:00:00.000Z',
      sourceUrl: 'https://rvce.edu.in/examination-rules',
      files: [
        {
          url: '/uploads/RVCE_CoE_Exam_HallTicket_Instructions.pdf',
          name: 'RVCE_CoE_Exam_HallTicket_Instructions.pdf',
          isImage: false,
          size: 1180,
        },
      ],
      links: [
        { label: 'RVCE Student SAP / ERP Portal', url: 'https://contineo.rvce.edu.in' },
        { label: 'Approved Calculator List (Autonomous)', url: 'https://rvce.edu.in/coe/calculator-rules' },
      ],
    },
    {
      title: 'RVCE Central Library: Extended 24x7 Reading Room Hours for Exam Season',
      category: 'General',
      description: 'The Chief Librarian and Library Committee announce that the Central Library reading rooms and digital resource center will remain open until 11:30 PM on all working days, with 24-hour reading room access in the Dr. M. S. Ramaiah block during the upcoming SEE examination period. Fast Wi-Fi and high-speed electrical study cubicles are available for CSE students.',
      pinned: false,
      deadline: '2026-12-30T18:00:00.000Z',
      publishedAt: '2026-11-22T10:00:00.000Z',
      sourceUrl: 'https://rvce.edu.in/library',
      files: [
        {
          url: '/uploads/RVCE_Library_Extended_Night_Hours.pdf',
          name: 'RVCE_Library_Extended_Night_Hours.pdf',
          isImage: false,
          size: 920,
        },
      ],
      links: [
        { label: 'RVCE Digital Library (IEEE Xplore / ACM DL)', url: 'https://digitallibrary.rvce.edu.in' },
      ],
    },
  ];

  console.log(`Posting ${announcementsToCreate.length} tailored announcements...`);

  for (const item of announcementsToCreate) {
    const postRes = await fetch('http://localhost:5000/api/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });

    const postJson = await postRes.json();
    if (postRes.ok) {
      console.log(`✅ [ID ${postJson.data._id}] Created: "${postJson.data.title.substring(0, 45)}..." (${postJson.data.category})`);
    } else {
      console.error(`❌ Failed: "${item.title}"`, postJson);
    }
  }

  console.log('Seeding completed successfully!');
}

runSeed().catch(console.error);
