/**
 * Automated Verification Script for CampusNotice API
 * Runs all 14 test scenarios and logs pass/fail results.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

const logResult = (num, name, passed, details = '') => {
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [Test ${num}] ${name} ${details ? '(' + details + ')' : ''}`);
};

export const runTests = async () => {
  console.log('===============================================================');
  console.log(`Starting CampusNotice API Verification on ${BASE_URL}...`);
  console.log('===============================================================\n');

  let passedCount = 0;
  let totalCount = 14;
  let adminToken = '';
  let createdId = null;

  try {
    // 1. Health check
    const r1 = await fetch(`${BASE_URL}/health`);
    const j1 = await r1.json();
    const p1 = r1.status === 200 && j1.success === true;
    if (p1) passedCount++;
    logResult(1, 'Health Check', p1, `Status: ${r1.status}`);

    // 2. List all announcements
    const r2 = await fetch(`${BASE_URL}/announcements`);
    const j2 = await r2.json();
    const p2 = r2.status === 200 && Array.isArray(j2.data) && j2.pagination !== undefined;
    if (p2) passedCount++;
    logResult(2, 'List Announcements', p2, `Count: ${j2.data?.length || 0}`);

    // 3. Search announcements
    const r3 = await fetch(`${BASE_URL}/announcements?search=exam`);
    const j3 = await r3.json();
    const p3 = r3.status === 200 && Array.isArray(j3.data);
    if (p3) passedCount++;
    logResult(3, 'Search Announcements (search=exam)', p3, `Matches: ${j3.data?.length || 0}`);

    // 4. Filter by category
    const r4 = await fetch(`${BASE_URL}/announcements?category=Examinations`);
    const j4 = await r4.json();
    const p4 = r4.status === 200 && j4.data.every((a) => a.category === 'Examinations');
    if (p4) passedCount++;
    logResult(4, 'Filter Category (Examinations)', p4, `Matches: ${j4.data?.length || 0}`);

    // 5. Sort and paginate
    const r5 = await fetch(`${BASE_URL}/announcements?page=1&limit=2&sort=oldest`);
    const j5 = await r5.json();
    const p5 = r5.status === 200 && j5.pagination.limit === 2 && j5.data.length <= 2;
    if (p5) passedCount++;
    logResult(5, 'Sort and Paginate (limit=2, sort=oldest)', p5, `Returned: ${j5.data.length}`);

    // 7. Admin Login (Username: admin, Password: Admin@123)
    const r7 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Admin@123' }),
    });
    const j7 = await r7.json();
    const p7 = r7.status === 200 && j7.data?.token !== undefined;
    if (p7) {
      adminToken = j7.data.token;
      passedCount++;
    }
    logResult(7, 'Admin Login (admin / Admin@123)', p7, `Token received: ${Boolean(adminToken)}`);

    // 8. Create announcement (Protected) -> will receive clean auto-incremented ID (e.g. 9)
    const r8 = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Mid-Semester Hackathon 2026',
        description: 'Annual computer science project showcase and hackathon open to all years.',
        category: 'Events',
        pinned: true,
        sourceUrl: 'https://college.edu/hackathon',
      }),
    });
    const j8 = await r8.json();
    const p8 = r8.status === 201 && typeof j8.data?._id === 'number';
    if (p8) {
      createdId = j8.data._id;
      passedCount++;
    }
    logResult(8, 'Create Announcement (Auto Numeric ID)', p8, `Created clean ID: ${createdId}`);

    // 6. Retrieve single announcement by clean ID (e.g. ID 1 or createdId)
    const r6 = await fetch(`${BASE_URL}/announcements/1`);
    const j6 = await r6.json();
    const p6 = r6.status === 200 && j6.data?._id === 1;
    if (p6) passedCount++;
    logResult(6, 'Retrieve Single Announcement (ID: 1)', p6, `Title: ${j6.data?.title?.substring(0, 30)}...`);

    // 9. Update announcement by clean ID
    const r9 = await fetch(`${BASE_URL}/announcements/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Updated Mid-Semester Hackathon 2026',
        pinned: false,
      }),
    });
    const j9 = await r9.json();
    const p9 = r9.status === 200 && j9.data?.title === 'Updated Mid-Semester Hackathon 2026';
    if (p9) passedCount++;
    logResult(9, 'Update Announcement (ID: ' + createdId + ')', p9, `New Title verified`);

    // 10. Delete announcement by clean ID
    const r10 = await fetch(`${BASE_URL}/announcements/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const j10 = await r10.json();
    const p10 = r10.status === 200 && j10.success === true;
    if (p10) passedCount++;
    logResult(10, 'Delete Announcement (ID: ' + createdId + ')', p10, `Status: ${r10.status}`);

    // 11. Validation Failure (Invalid input)
    const r11 = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: '',
        category: 'InvalidCategory',
        sourceUrl: 'bad-url',
      }),
    });
    const j11 = await r11.json();
    const p11 = r11.status === 400 && j11.success === false && Array.isArray(j11.errors);
    if (p11) passedCount++;
    logResult(11, 'Validation Failure Handling', p11, `Expected 400, got ${r11.status}`);

    // 12. Nonexistent Announcement ID (ID 99999 -> 404)
    const r12 = await fetch(`${BASE_URL}/announcements/99999`);
    const j12 = await r12.json();
    const p12 = r12.status === 404 && j12.success === false;
    if (p12) passedCount++;
    logResult(12, 'Nonexistent Clean ID (ID: 99999 -> 404)', p12, `Status: ${r12.status}`);

    // 13. Write without token (401)
    const r13 = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthenticated Title',
        description: 'Should fail',
        category: 'General',
      }),
    });
    const j13 = await r13.json();
    const p13 = r13.status === 401 && j13.success === false;
    if (p13) passedCount++;
    logResult(13, 'Write Without Token (401)', p13, `Status: ${r13.status}`);

    // 14. Write with invalid token (401)
    const r14 = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_signature_token',
      },
      body: JSON.stringify({
        title: 'Tampered Token',
        description: 'Should fail',
        category: 'General',
      }),
    });
    const j14 = await r14.json();
    const p14 = r14.status === 401 && j14.success === false;
    if (p14) passedCount++;
    logResult(14, 'Write With Invalid Token (401)', p14, `Status: ${r14.status}`);

    console.log('\n===============================================================');
    console.log(`Test Suite Complete: ${passedCount}/${totalCount} tests passed!`);
    console.log('===============================================================\n');

    return passedCount === totalCount;
  } catch (err) {
    console.error('Test execution error:', err.message);
    return false;
  }
};

// Run automatically if invoked via node
if (process.argv[1]?.endsWith('runApiTests.js')) {
  runTests().then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
  });
}
