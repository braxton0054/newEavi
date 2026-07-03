// Test email/password change via the API directly
const API = "http://localhost:4000";

async function main() {
  // 1. Login as super admin
  console.log("=== Logging in ===");
  const login = await fetch(`${API}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "braxtonkipchumba7@gmail.com", password: "Admin@123" }),
  });
  const loginData = await login.json();
  console.log("Login status:", login.status);
  if (!login.ok) { console.log("Login failed:", loginData); return; }

  // Get cookies from the response
  const cookies = login.headers.get("set-cookie");
  console.log("Got session cookie:", cookies?.substring(0, 50));

  // 2. Try changing email
  console.log("\n=== Testing email change ===");
  const emailRes = await fetch(`${API}/api/admin/credentials`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookies!,
    },
    body: JSON.stringify({ 
      newEmail: "braxtonkipchumba7@gmail.com", // same email, just testing endpoint
      currentPassword: "Admin@123" 
    }),
  });
  const emailData = await emailRes.json();
  console.log("Email endpoint status:", emailRes.status, JSON.stringify(emailData));

  // 3. Test password change via Better Auth
  console.log("\n=== Testing password change ===");
  const pwRes = await fetch(`${API}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookies!,
    },
    body: JSON.stringify({ 
      currentPassword: "Admin@123", 
      newPassword: "Admin@123" // same password, just testing
    }),
  });
  const pwData = await pwRes.json();
  console.log("Password change status:", pwRes.status, JSON.stringify(pwData));
}

main().catch(console.error);
