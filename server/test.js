import fs from 'fs';

async function test() {
  try {
    fs.writeFileSync('dummy.jpg', Buffer.from('hello'));
    
    const buffer = fs.readFileSync('dummy.jpg');
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    
    const form = new FormData();
    form.append('files', blob, 'dummy.jpg');
    
    const response = await fetch('http://localhost:3001/api/transcribe', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer 32888012Ba#'
      }
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Fetch Error:", error.message);
  }
}

test();
