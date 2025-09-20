const bcrypt = require('bcrypt');

async function testPasswords() {
  const storedHash = '$2b$10$An/w2uiL9TY4GHPBXQyWV.luaZh61g9O0u9ANzZ2Oc5XEyubBtCnm';
  
  // Test various common passwords that might have been used during registration
  const testPasswords = [
    'password',
    '123456', 
    'password123',
    'hanserief12',
    'hanserief',
    'karim076',
    'karim',
    '076',
    'admin',
    'test',
    'testpassword'
  ];
  
  console.log('Testing passwords against hash:', storedHash);
  console.log('');
  
  for (const testPass of testPasswords) {
    try {
      const isMatch = await bcrypt.compare(testPass, storedHash);
      console.log(`Password "${testPass}": ${isMatch ? 'Match!' : 'No match'}`);
      
      if (isMatch) {
        console.log(`\n🎉 FOUND IT! The password is: "${testPass}"`);
        break;
      }
    } catch (err) {
      console.log(`Password "${testPass}": ❌ error testing`);
    }
  }
}

testPasswords();
