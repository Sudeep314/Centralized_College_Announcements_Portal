import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Announcement from '../models/Announcement.js';

dotenv.config();

const sampleAnnouncements = [
  {
    title: 'Semester End Examination Schedule — Winter 2026',
    description: 'The timetable for the upcoming Winter 2026 Semester End Examinations has been released. All students must download their hall tickets from the student portal before November 10. Direct any clashes or queries to the exam cell.',
    category: 'Examinations',
    pinned: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    deadline: new Date('2026-11-15T18:00:00Z'),
    sourceUrl: 'https://college.edu/exams/winter2026',
    attachmentUrl: 'https://college.edu/documents/winter_2026_exam_schedule.pdf',
  },
  {
    title: 'Annual Tech Symposium "HackCampus 2026" Registrations Open',
    description: 'Department of Computer Science invites teams to register for HackCampus 2026. A 36-hour hackathon featuring tracks in Web3, AI, and Cloud Computing with cash prizes worth ₹1,00,000.',
    category: 'Events',
    pinned: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    deadline: new Date('2026-11-20T23:59:59Z'),
    sourceUrl: 'https://hackcampus2026.dev',
    attachmentUrl: 'https://college.edu/events/hackcampus_guidelines.pdf',
  },
  {
    title: 'Revised Academic Calendar for Second Semester',
    description: 'Please note the revised academic calendar approved by the Academic Council. Commencement of regular lab practicals will begin from next Monday. Attendance criteria of 75% remains strictly mandatory.',
    category: 'Academics',
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    deadline: null,
    sourceUrl: 'https://college.edu/academics/calendar-2026',
    attachmentUrl: null,
  },
  {
    title: 'Hostel Maintenance & Electrical Inspection Schedule',
    description: 'Routine maintenance of hostel blocks A, B, and C will be conducted between 10:00 AM and 04:00 PM this Saturday. Power backup will be operational during the outage period.',
    category: 'General',
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    deadline: new Date('2026-11-02T16:00:00Z'),
    sourceUrl: null,
    attachmentUrl: null,
  },
  {
    title: 'Mid-Term Re-Evaluation & Grade Inquiry Window',
    description: 'Students wishing to apply for re-evaluation of Mid-Term test papers must submit the application form along with the prescribed fee receipt to room 204 by Friday.',
    category: 'Examinations',
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
    deadline: new Date('2026-11-07T17:00:00Z'),
    sourceUrl: 'https://college.edu/exams/reeval',
    attachmentUrl: 'https://college.edu/forms/reevaluation_form.pdf',
  },
  {
    title: 'Guest Lecture on Cloud Native Architecture with Kubernetes',
    description: 'The Department of Information Science is hosting an industry session by Principal Architect from Google Cloud. Open to all 3rd and 4th-year engineering students.',
    category: 'Academics',
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 120), // 5 days ago
    deadline: null,
    sourceUrl: 'https://college.edu/seminars/cloud-native',
    attachmentUrl: null,
  },
  {
    title: 'Campus Blood Donation & Health Screening Camp',
    description: 'The Youth Red Cross unit of the college is organizing an annual voluntary blood donation drive in the college auditorium. Certificate of appreciation and refreshments provided.',
    category: 'Events',
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 144), // 6 days ago
    deadline: new Date('2026-11-12T14:00:00Z'),
    sourceUrl: null,
    attachmentUrl: null,
  },
  {
    title: 'Central Library Extended Study Hours During Exam Month',
    description: 'The Central Library reading hall will remain open until midnight (12:00 AM) starting next week to facilitate student exam preparation. Please maintain decorum.',
    category: 'General',
    pinned: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 168), // 7 days ago
    deadline: null,
    sourceUrl: 'https://college.edu/library',
    attachmentUrl: null,
  },
];

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('FATAL: MONGODB_URI missing in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing sample announcements
    await Announcement.deleteMany({});
    console.log('[Seed] Cleared existing announcements collection');

    // Insert new sample records
    const inserted = await Announcement.insertMany(sampleAnnouncements);
    console.log(`[Seed] Successfully inserted ${inserted.length} sample announcements!`);

    console.log('\n--- Sample Announcements Summary ---');
    inserted.forEach((a, i) => {
      console.log(`${i + 1}. [${a.category}] ${a.title} (Pinned: ${a.pinned})`);
    });

    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB. Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedData();
