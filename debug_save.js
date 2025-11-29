
async function test() {
  try {
    console.log('Sending request to http://localhost:3000/api/events ...')
    const res = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Debug Event ' + Date.now(),
        startAtMillis: Date.now() + 3600000,
        isFree: true,
        description: 'Test description'
      })
    })
    console.log('Status:', res.status)
    const text = await res.text()
    console.log('Body:', text)
  } catch (e) {
    console.error('Fetch Error:', e.cause || e.message)
  }
}

test()

