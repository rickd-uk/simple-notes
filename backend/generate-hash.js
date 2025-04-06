const bcrypt = require('bcrypt');

async function generateHash() {
  const plainPassword = 'notesapp2025'; // Simple, easy to remember password
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    console.log('Password:', plainPassword);
    console.log('Password hash:', hash);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
