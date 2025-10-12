import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg'

export default function LocationPicker({ address, onAddressChange, point, onPointChange }:{
  address: string,
  onAddressChange: (v:string)=>void,
  point: { lon:number, lat:number } | null,
  onPointChange: (p:{ lon:number, lat:number } | null)=>void
}){
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map>()
  const markerRef = useRef<mapboxgl.Marker>()
  const [suggestions, setSuggestions] = useState<{ id:string, name:string, lon:number, lat:number }[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)

  function sanitizePlaceName(name: string): string {
    let s = String(name || '')
    // remove RU region codes like RU-MOS, RU-SPE
    s = s.replace(/\bRU-[A-Z]{2,3}\b/g, '')
    // remove country suffix like ', Россия' or 'Россия'
    s = s.replace(/,?\s*Россия\b/gi, '')
    // remove postal codes of 5-6 digits at ends or surrounded by commas
    s = s.replace(/,?\s*\b\d{5,6}\b/g, '')
    // collapse extra commas/spaces
    s = s.replace(/\s*,\s*,+/g, ', ').replace(/\s{2,}/g, ' ').replace(/\s*,\s*$/,'').trim()
    return s
  }

  useEffect(() => {
    if (!ref.current) return
    const map = new mapboxgl.Map({ container: ref.current, style: 'mapbox://styles/mapbox/streets-v12', center: [37.6176, 55.7558], zoom: 10 })
    mapRef.current = map
    map.on('load', () => {
      if (point) {
        markerRef.current = new mapboxgl.Marker().setLngLat([point.lon, point.lat]).addTo(map)
        map.setCenter([point.lon, point.lat])
      }
    })
    // Click on map to set marker and reverse-geocode address
    map.on('click', async (e) => {
      setSuggestions([])
      const p = { lon: e.lngLat.lng, lat: e.lngLat.lat }
      onPointChange(p)
      if (!markerRef.current) markerRef.current = new mapboxgl.Marker().addTo(map)
      markerRef.current!.setLngLat([p.lon, p.lat])
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${p.lon},${p.lat}.json?types=address,poi,place&limit=1&language=ru&country=ru&access_token=${mapboxgl.accessToken}`
        const r = await fetch(url); const j = await r.json(); const f = j?.features?.[0]
        if (f && f.place_name) onAddressChange(sanitizePlaceName(f.place_name))
      } catch {}
    })
    return () => { map.remove() }
  }, [])

  // Removed explicit geocode button; we rely on suggestions click or setAtCenter

  // setAtCenter removed; using map click instead

  // Autocomplete suggestions
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!address || address.trim().length < 3) { setSuggestions([]); return }
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true)
        const center = mapRef.current?.getCenter()
        const prox = center ? `&proximity=${center.lng},${center.lat}` : ''
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?types=address,poi,place&autocomplete=true&limit=5&language=ru&country=ru${prox}&access_token=${mapboxgl.accessToken}`
        const r = await fetch(url)
        const j = await r.json()
        const items: { id:string, name:string, lon:number, lat:number }[] = (j?.features || []).map((f:any) => ({
          id: f.id as string,
          name: sanitizePlaceName(f.place_name),
          lon: f.center?.[0],
          lat: f.center?.[1]
        })).filter((x: { lon:number, lat:number }) => typeof x.lon === 'number' && typeof x.lat === 'number')
        setSuggestions(items)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [address])

  function selectSuggestion(item: { id:string, name:string, lon:number, lat:number }){
    onAddressChange(item.name)
    onPointChange({ lon: item.lon, lat: item.lat })
    const map = mapRef.current; if (map) {
      if (!markerRef.current) markerRef.current = new mapboxgl.Marker().addTo(map)
      markerRef.current!.setLngLat([item.lon, item.lat])
      map.easeTo({ center:[item.lon, item.lat], zoom: 14 })
    }
    setSuggestions([])
  }

  return (
    <div>
      <div className="row" style={{ gap: 8, marginBottom: 8, position:'relative' }}>
        <input placeholder="Адрес" value={address} onChange={e=>onAddressChange(e.target.value)} />
        {(suggestions.length>0) && (
          <div style={{ position:'absolute', left:0, right:0, top:48, background:'#0f0f0f', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, zIndex:20, overflow:'hidden' }}>
            {suggestions.map(s => (
              <div key={s.id} onClick={()=>selectSuggestion(s)} style={{ padding:'10px 12px', cursor:'pointer' }}>
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div ref={ref} onClick={()=>setSuggestions([])} style={{ width:'100%', height: 220, borderRadius: 12, overflow:'hidden' }} />
    </div>
  )
}


