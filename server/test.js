// Test the full transcribe endpoint with a real PNG image
import fs from 'fs';
import path from 'path';

// Create a minimal valid 1x1 red PNG (base64 decoded)
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
fs.writeFileSync('test_image.png', PNG_1X1);

async function testEndpoint() {
  const imageBlob = new Blob([PNG_1X1], { type: 'image/png' });
  const form = new FormData();
  form.append('files', imageBlob, 'test_image.png');

  console.log("--- Test 1: Wrong password (should get 401) ---");
  const r1 = await fetch('http://localhost:3001/api/transcribe', {
    method: 'POST',
    body: new FormData(),
    headers: { 'Authorization': 'Bearer wrongpassword' }
  });
  console.log("Status:", r1.status);
  const d1 = await r1.json();
  console.log("Body:", d1);

  console.log("\n--- Test 2: Correct password with image (should call AI) ---");
  const form2 = new FormData();
  form2.append('files', imageBlob, 'test_image.png');
  const r2 = await fetch('http://localhost:3001/api/transcribe', {
    method: 'POST',
    body: form2,
    headers: { 'Authorization': 'Bearer 32888012Ba#' }
  });
  console.log("Status:", r2.status);
  const d2 = await r2.json();
  console.log("Body:", JSON.stringify(d2).substring(0, 300));
}

testEndpoint().catch(console.error);
