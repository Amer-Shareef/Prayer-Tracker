const bcrypt = require("bcrypt");

async function hashPassword(password) {
  const saltRounds = 10;
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Password: "${password}"`);
    console.log(`Bcrypt hash: "${hash}"`);

    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Verification test: ${isValid ? "PASSED" : "FAILED"}`);

    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
  }
}

// Test with the password we want to use
hashPassword("password123").then((hash) => {
  console.log("\nSQL Command to update users:");
  console.log(
    `UPDATE users SET password_hash='${hash}' WHERE username IN ('admin', 'founder', 'member');`
  );
});
