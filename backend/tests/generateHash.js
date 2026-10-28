import bcrypt from 'bcryptjs';

/**
 * Utility script to hash an admin password using bcrypt.
 * Usage: node tests/generateHash.js <myPassword>
 */
const passwordToHash = process.argv[2] || 'admin123';

const saltRounds = 10;
const hash = bcrypt.hashSync(passwordToHash, saltRounds);

console.log('--------------------------------------------------');
console.log(`Password: ${passwordToHash}`);
console.log(`Bcrypt Hash: ${hash}`);
console.log('--------------------------------------------------');
console.log('Copy this hash to ADMIN_PASSWORD_HASH in your .env file.');
