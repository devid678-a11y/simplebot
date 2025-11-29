const API_URL = 'http://localhost:3000/api/events';

async function testCreateLarge() {
  // Создаем большую строку base64 (~1MB)
  const largeBase64 = 'data:image/png;base64,' + 'a'.repeat(1024 * 1024);

  const event = {
    title: 'Test Event Large Image',
    startAtMillis: Date.now() + 200000,
    imageUrls: [largeBase64],
    description: 'Debug event large'
  };

  try {
    console.log('Sending LARGE request to:', API_URL);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 200)); // Первые 200 символов

    if (res.ok) {
      console.log('✅ Success!');
    } else {
      console.log('❌ Failed!');
    }
  } catch (e) {
    console.error('Network error:', e);
  }
}

testCreateLarge();

