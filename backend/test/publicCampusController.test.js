const test = require('node:test');
const assert = require('node:assert/strict');
const { toPublicFacultyProfile } = require('../controllers/publicCampusController');

test('public faculty projection excludes private contact and account data', () => {
  const profile = toPublicFacultyProfile({
    name: 'Demo Faculty',
    role: 'FACULTY',
    department: 'Computer Science',
    courses: ['Algorithms'],
    profileImage: '/uploads/profile.png',
    email: 'private@example.edu',
    phone: '1234567890',
    password: 'hashed-password',
    studentDobHash: 'private-hash'
  });

  assert.deepEqual(profile, {
    name: 'Demo Faculty',
    department: 'Computer Science',
    courses: ['Algorithms'],
    profileImage: '/uploads/profile.png'
  });
});

test('public faculty projection safely handles missing optional fields', () => {
  assert.deepEqual(toPublicFacultyProfile({ name: 'Faculty Member' }), {
    name: 'Faculty Member',
    department: '',
    courses: [],
    profileImage: ''
  });
});
