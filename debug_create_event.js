const API_URL = 'http://localhost:3000/api/events';

async function testCreate() {
  // Маленькая картинка 1x1 пиксель base64
  const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const event = {
    title: 'Test Event with Image',
    startAtMillis: Date.now() + 100000,
    imageUrls: [base64Image],
    description: 'Debug event'
  };

  try {
    console.log('Sending request to:', API_URL);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);

    if (res.ok) {
      console.log('✅ Success!');
    } else {
      console.log('❌ Failed!');
    }
  } catch (e) {
    console.error('Network error:', e);
  }
}

testCreate();
