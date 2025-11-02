// Quick sanity check for Timeweb AI agent
const AI_URL_BASE = process.env.TIMEWEB_AI_URL || process.env.AI_URL || 'https://agent.timeweb.cloud/api/v1/cloud-ai/agents/3ef82647-9ad7-492b-a959-c5a78be61e2b/v1'
const AI_TOKEN = process.env.TIMEWEB_AI_TOKEN || process.env.AI_TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjFrYnhacFJNQGJSI0tSbE1xS1lqIn0.eyJ1c2VyIjoiYmM0NDU5MzUiLCJ0eXBlIjoiYXBpX2tleSIsImFwaV9rZXlfaWQiOiI0NjlmNDM1Yi02NDI0LTRkZDUtYjY3NS02NzIyNDJjY2E2MTciLCJpYXQiOjE3NjA4ODcwNjd9.T7uMZ9sOS3iUD8MNz6p2MIzGbZ-ih-6NlNSkmAww7ic3Jm_y1ofVkwRzcbJq_EXT4by2sxC1Y2tnuEE-MpWGQ2wBRNCAD1yTC-dGvp07KsmmZmby8qJhfrTt1Ttwx_GkFpCLOrXUHZlXQIwCZBJ1Vqp1h7fzR1JxFdunTC3zERZzTS3gBggwd0BvPKk_hqjobuoMEUpfmoh90ib58qSOwbUhKbGz3hTZfWWyPlOlcBmvy-3htwsYbtiNmwWtc7qV5zVd39eK_37pOb7ytzRLiykNpeEufLBLz_p96N42hbV-sPkK00hAXLkxpfyS0wSFQKR2vOpE1avdW6M2tOiVBHHJ0ah5vwFDZ6hQEpGCa-viy8EtckjFM5FGVYlRySPl4EmXwoa6Bk1eRxrEEUu8D2q_mWzsgq7jdx6-mVmE79zOb_4QZVM5w1M0jlaY9obvd_uUImjPIPLIXmKU16bUCFqwFybUyWu0212DpMj3dTpwijx2-Tr7tVsuHkcV9-7S'
const AI_URL = AI_URL_BASE.endsWith('/v1') ? `${AI_URL_BASE}/chat/completions` : AI_URL_BASE
const AI_MODEL = process.env.TIMEWEB_AI_MODEL || process.env.AI_MODEL || 'gpt-4o-mini'

async function main() {
  const system = 'Ответь одним словом: ПОДТВЕРЖДЕНО'
  const user = 'Проверь доступ к агенту Timeweb'
  const t0 = Date.now()
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AI_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: AI_MODEL, messages: [ { role: 'system', content: system }, { role: 'user', content: user } ] })
  })
  const t1 = Date.now()
  console.log('HTTP', res.status, res.statusText, 'time', (t1-t0)+'ms')
  const json = await res.json().catch(()=>({}))
  const content = json?.choices?.[0]?.message?.content || JSON.stringify(json).slice(0,200)
  console.log('Reply:', content)
}

main().catch(e => { console.error('Test failed:', e) })


