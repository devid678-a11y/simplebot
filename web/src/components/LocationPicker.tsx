import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Используем переменную окружения или хардкод (если локально)
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1IjoiZGV2aWQ2NzgiLCJhIjoiY21jM3A5bmd4MDMyaDJvcXY4emRwMmxnMiJ9.TL4w0VihB4fVY9cdUYxqMg'

export default function LocationPicker({ address, onAddressChange, point, onPointChange }:{
  address: string,
  onAddressChange: (v:string)=>void,
  point: { lon:number, lat:number } | null,
  onPointChange: (p:{ lon:number, lat:number } | null)=>void
}){
  // Состояние для подсказок
  // Mapbox возвращает массив features
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)
  
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  // Флаг, чтобы не искать адрес при ручном выборе на карте или выборе подсказки
  const ignoreNextSearch = useRef(false)

  // Инициализация карты
  useEffect(() => {
    if (map.current) return
    if (!mapContainer.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    
    const initialCenter: [number, number] = point ? [point.lon, point.lat] : [37.6173, 55.7558] // Москва по умолчанию
    const initialZoom = point ? 14 : 9

    try {
      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Темная тема карты, чтобы сочеталась
        center: initialCenter,
        zoom: initialZoom
      })
      
      map.current = m

      m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      m.on('click', (e) => {
        const { lng, lat } = e.lngLat
        updatePoint(lng, lat)
        // При клике по карте делаем обратное геокодирование
        fetchAddress(lng, lat)
      })

      // Если точка уже была, ставим маркер
      if (point) {
        marker.current = new mapboxgl.Marker({ color: '#00E5FF' })
          .setLngLat([point.lon, point.lat])
          .addTo(m)
      }

    } catch (e) {
      console.error('Error init map in picker:', e)
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Обновление маркера при изменении props.point
  useEffect(() => {
    if (!map.current) return
    if (point) {
      if (!marker.current) {
        marker.current = new mapboxgl.Marker({ color: '#00E5FF' })
          .setLngLat([point.lon, point.lat])
          .addTo(map.current)
      } else {
        marker.current.setLngLat([point.lon, point.lat])
      }
      // Плавно переходим к точке, если она далеко
      const currentCenter = map.current.getCenter()
      const dist = Math.sqrt(Math.pow(currentCenter.lng - point.lon, 2) + Math.pow(currentCenter.lat - point.lat, 2))
      if (dist > 0.01) {
        map.current.flyTo({ center: [point.lon, point.lat], zoom: 14 })
      }
    }
  }, [point?.lon, point?.lat])

  function updatePoint(lng: number, lat: number) {
    onPointChange({ lon: lng, lat: lat })
  }

  // Обратное геокодирование (координаты -> адрес)
  async function fetchAddress(lng: number, lat: number) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi&limit=1&language=ru&access_token=${MAPBOX_TOKEN}`
      const r = await fetch(url)
      if (r.ok) {
        const j = await r.json()
        if (j.features && j.features.length > 0) {
           let placeName = j.features[0].place_name
           // Убираем индекс (обычно это цифры в конце или начале)
           // Mapbox часто возвращает: "улица, дом, город, регион, индекс, страна"
           // Попробуем просто убрать почтовый индекс (6 цифр)
           placeName = cleanAddress(placeName)
           
           ignoreNextSearch.current = true // Блокируем поиск по этому тексту
           onAddressChange(placeName)
        }
      }
    } catch (e) {
      console.error('Reverse geo error:', e)
    }
  }

  // Поиск адреса (текст -> координаты) через Mapbox
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    
    if (ignoreNextSearch.current) {
      ignoreNextSearch.current = false
      return
    }

    if (!address || address.trim().length < 3) { 
      setSuggestions([])
      return 
    }
    
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true)
        // Ищем адреса в России (country=ru)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=ru&language=ru&limit=5&access_token=${MAPBOX_TOKEN}`
        
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.features || [])
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error(error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 500)
    
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [address])

  function selectSuggestion(feature: any){
    let placeName = feature.place_name
    placeName = cleanAddress(placeName)
    
    ignoreNextSearch.current = true
    onAddressChange(placeName)
    
    const [lng, lat] = feature.center
    if (!isNaN(lat) && !isNaN(lng)) {
        onPointChange({ lon: lng, lat: lat })
    }
    setSuggestions([])
  }

  // Функция очистки адреса от индекса и страны "Россия"
  function cleanAddress(addr: string) {
    if (!addr) return ''
    // Разделим по запятым
    let parts = addr.split(',').map(p => p.trim())
    
    // Удаляем "Россия"
    parts = parts.filter(p => p !== 'Россия')
    
    // Удаляем индексы (обычно 6 цифр)
    parts = parts.filter(p => !/^\d{6}$/.test(p))

    return parts.join(', ')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <input 
          placeholder="Введите адрес или выберите на карте" 
          value={address} 
          onChange={e => onAddressChange(e.target.value)}
          style={{ width: '100%', paddingRight: 30 }}
        />
        {loading && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>...</div>}
        
        {suggestions.length > 0 && (
          <div style={{ 
            position: 'absolute', left: 0, right: 0, top: 46, 
            background: 'var(--card-bg, #222)', border: '1px solid var(--border, #333)', borderRadius: 8, 
            zIndex: 1000, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {suggestions.map((s) => (
              <div key={s.id} onClick={() => selectSuggestion(s)} 
                   className="suggestion-item"
                   style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border, #333)', color: 'var(--text)' }}>
                {cleanAddress(s.place_name)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Карта */}
      <div style={{ height: 250, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 10, pointerEvents: 'none' }}>
           Нажмите на карту для выбора
        </div>
      </div>
      
      <style>{`
        .suggestion-item:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  )
}
