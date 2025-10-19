import { useEffect, useMemo, useState } from 'react'

type CoverageRow = { [seam: string]: number }

// Покрытие м² на одну тубу для стандартных размеров плитки (из таблицы)
const COVERAGE_TABLE: Record<string, CoverageRow> = {
  '1200x2400': { '1': 17, '2': 11.5, '3': 8.5 },
  '900x1800': { '1': 15, '2': 10.5, '3': 8 },
  '600x1200': { '1': 11.5, '2': 8, '3': 6 },
  '200x1000': { '1': 5, '2': 3, '3': 2.5 },
  '150x900': { '1': 4, '2': 2.5, '3': 2 },
  '800x800': { '1': 10, '2': 7, '3': 5 },
  '400x800': { '1': 7.5, '2': 5.5, '3': 4 },
  '600x600': { '1': 8, '2': 5.5, '3': 4 },
  '400x400': { '1': 6, '2': 4, '3': 3 },
  '300x600': { '1': 6, '2': 4, '3': 3 },
  '300x300': { '1': 4.5, '2': 3, '3': 2.5 },
  '200x200': { '1': 3, '2': 2, '3': 1.5 },
}

const KEYS = Object.keys(COVERAGE_TABLE)

function findNearestKey(widthMm: number, heightMm: number): string {
  let bestKey = '600x600'
  let bestDist = Number.POSITIVE_INFINITY
  for (const key of KEYS) {
    const [a, b] = key.split('x').map(Number)
    const d1 = Math.abs(widthMm - a) + Math.abs(heightMm - b)
    const d2 = Math.abs(widthMm - b) + Math.abs(heightMm - a)
    const d = Math.min(d1, d2)
    if (d < bestDist) { bestDist = d; bestKey = key }
  }
  return bestKey
}

function coverageForKey(key: string, seamMm: number): number {
  const row = COVERAGE_TABLE[key]
  if (!row) return 5 // дефолтная страховка
  if (seamMm in (row as any)) return row[String(seamMm)]
  // Линейная интерполяция для 1.5 мм
  if (seamMm === 1.5) {
    const v1 = row['1']
    const v2 = row['2']
    return (v1 + v2) / 2
  }
  // На всякий случай интерполяция между ближними целыми
  const below = Math.floor(seamMm)
  const above = Math.ceil(seamMm)
  const vb = row[String(below)]
  const va = row[String(above)]
  if (vb && va) {
    const t = seamMm - below
    return vb + (va - vb) * t
  }
  return row['2']
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

function toFixedSmart(n: number): string {
  if (n < 10) return n.toFixed(2)
  if (n < 100) return n.toFixed(1)
  return n.toFixed(0)
}

function Labeled({ label, children }: { label: string, children: any }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
}

function Stepper({ value, setValue, step = 0.1, min = 0, max = 999, suffix = '' }: {
  value: number,
  setValue: (v: number) => void,
  step?: number,
  min?: number,
  max?: number,
  suffix?: string,
}) {
  const dec = () => setValue(clamp(Number((value - step).toFixed(2)), min, max))
  const inc = () => setValue(clamp(Number((value + step).toFixed(2)), min, max))
  return (
    <div className="row" style={{ gap: 12 }}>
      <button onClick={dec} className="btn-ghost" aria-label="-">−</button>
      <input type="number" step={step} min={min} max={max} value={value}
        onChange={e => setValue(clamp(parseFloat(e.target.value || '0'), min, max))}
        style={{ textAlign: 'center', width: 120, fontWeight: 600 }} />
      <div className="muted" style={{ width: 28 }}>{suffix}</div>
      <button onClick={inc} className="btn-ghost" aria-label="+">+</button>
    </div>
  )
}

function Range({ value, setValue, min, max, step }: { value: number, setValue: (v: number) => void, min: number, max: number, step: number }) {
  return (
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => setValue(parseFloat(e.target.value))} className="range" />
  )
}

function Segmented({ value, setValue, options }: { value: number, setValue: (v: number) => void, options: number[] }) {
  return (
    <div className="segmented">
      {options.map(opt => (
        <label key={opt} className={`seg-opt ${value === opt ? 'active' : ''}`}
          onClick={() => setValue(opt)}>
          {opt}
        </label>
      ))}
      <div className="seg-bg" style={{ transform: `translateX(${options.indexOf(value) * 100}%)` }} />
    </div>
  )
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplay(value))
    return () => cancelAnimationFrame(id)
  }, [value])
  return <div className="num-flip">{toFixedSmart(display)}</div>
}

export default function GroutCalc() {
  // размеры стены, м
  const [wallW, setWallW] = useState(6)
  const [wallH, setWallH] = useState(2.7)
  // размеры плитки, м
  const [tileW, setTileW] = useState(0.6)
  const [tileH, setTileH] = useState(0.6)
  // строковые значения для удобного редактирования (поддержка запятой и пустого)
  const [tileWStr, setTileWStr] = useState('0.60')
  const [tileHStr, setTileHStr] = useState('0.60')
  // ширина шва, мм
  const [seam, setSeam] = useState<1 | 1.5 | 2 | 3>(1.5)

  const area = useMemo(() => wallW * wallH, [wallW, wallH])
  const key = useMemo(() => {
    const wmm = Math.round(tileW * 1000)
    const hmm = Math.round(tileH * 1000)
    return findNearestKey(wmm, hmm)
  }, [tileW, tileH])
  const coverage = useMemo(() => coverageForKey(key, seam), [key, seam])
  const tubes = useMemo(() => area / coverage, [area, coverage])
  const tubesCeil = useMemo(() => Math.ceil(tubes), [tubes])

  const [pulse, setPulse] = useState(0)
  useEffect(() => { setPulse(p => p + 1) }, [tubes])

  return (
    <div style={{ padding: 16 }}>
      <div className="calc-shell card" style={{ padding: 16, borderRadius: 20 }}>
      <div className="page-title">Калькулятор эпоксидной затирки</div>

      <div className="grid2">
        <div className="card" style={{ padding: 16 }}>
          <div className="section-title">Стена</div>
          <div className="row" style={{ gap: 16, marginTop: 8 }}>
            <Labeled label="Ширина стены (м)"><Stepper value={wallW} setValue={setWallW} step={0.1} min={0.5} max={50} suffix="м" /></Labeled>
          </div>
          <div style={{ height: 12 }} />
          <Labeled label="Высота стены (м)"><Stepper value={wallH} setValue={setWallH} step={0.1} min={0.5} max={20} suffix="м" /></Labeled>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="section-title">Плитка</div>
          <div className="row" style={{ gap: 16, marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <Labeled label={`Длина плитки (м)`}>
                <div className="row" style={{ gap: 8 }}>
                  <input type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={tileWStr}
                    onChange={e => setTileWStr(e.target.value)}
                    onBlur={() => { const s = tileWStr.replace(',', '.').trim(); if (s === '') { setTileWStr(tileW.toFixed(2)); return } const n = clamp(parseFloat(s), 0.1, 2.4); if (Number.isFinite(n)) { setTileW(n); setTileWStr(n.toFixed(2)) } else { setTileWStr(tileW.toFixed(2)) } }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    style={{ width: 100, textAlign: 'center' }} />
                  <div className="muted" style={{ fontSize: 12 }}>(текущее: {tileW.toFixed(2)} м)</div>
                </div>
                <Range value={tileW} setValue={(v) => { setTileW(v); setTileWStr(v.toFixed(2)) }} min={0.1} max={2.4} step={0.01} />
              </Labeled>
            </div>
            <div style={{ flex: 1 }}>
              <Labeled label={`Ширина плитки (м)`}>
                <div className="row" style={{ gap: 8 }}>
                  <input type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={tileHStr}
                    onChange={e => setTileHStr(e.target.value)}
                    onBlur={() => { const s = tileHStr.replace(',', '.').trim(); if (s === '') { setTileHStr(tileH.toFixed(2)); return } const n = clamp(parseFloat(s), 0.1, 2.4); if (Number.isFinite(n)) { setTileH(n); setTileHStr(n.toFixed(2)) } else { setTileHStr(tileH.toFixed(2)) } }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    style={{ width: 100, textAlign: 'center' }} />
                  <div className="muted" style={{ fontSize: 12 }}>(текущее: {tileH.toFixed(2)} м)</div>
                </div>
                <Range value={tileH} setValue={(v) => { setTileH(v); setTileHStr(v.toFixed(2)) }} min={0.1} max={2.4} step={0.01} />
              </Labeled>
            </div>
          </div>
          <div className="muted" style={{ marginTop: 8 }}>Ближайший стандарт: <b>{key.replace('x', '×')} мм</b></div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="section-title">Ширина шва (мм)</div>
        <Segmented value={seam} setValue={v => setSeam(v as any)} options={[1, 1.5, 2, 3]} />
        <div className="muted" style={{ marginTop: 8 }}>Покрытие на тубу: <b>{coverage} м²</b></div>
      </div>

      <div className="card result-card" style={{ padding: 16 }}>
        <div className="muted">К покупке</div>
        <div className={`result-number pulse-${pulse % 2}`}>
          <AnimatedNumber value={tubesCeil} /> <span className="muted" style={{ marginLeft: 6 }}>туб</span>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>Точное значение: {toFixedSmart(tubes)} туб · Площадь стены: {area.toFixed(2)} м²</div>
      </div>

      <div className="muted" style={{ fontSize: 12 }}>
        Расчёт основан на таблице производителей для стандартной толщины плитки. Результат ориентировочный.
      </div>
      </div>
    </div>
  )
}


