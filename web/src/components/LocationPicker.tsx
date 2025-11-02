import { useEffect, useRef, useState } from 'react'

export default function LocationPicker({ address, onAddressChange, point, onPointChange }:{
  address: string,
  onAddressChange: (v:string)=>void,
  point: { lon:number, lat:number } | null,
  onPointChange: (p:{ lon:number, lat:number } | null)=>void
}){
  const [suggestions, setSuggestions] = useState<{ value: string, data: { geo_lat: string, geo_lon: string } }[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!address || address.trim().length < 3) { setSuggestions([]); return }
    
    debounceRef.current = window.setTimeout(async () => {
      try {
        setLoading(true)
        // DaData API для русскоязычных подсказок адресов
        const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Token 7b0b4a0b4a0b4a0b4a0b4a0b4a0b4a0b4a0b4a0b', // Публичный токен для демо
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            query: address,
            count: 5,
            locations: [{ country: 'Россия' }]
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions || [])
        } else {
          // Fallback на Yandex Geocoder если DaData недоступен
          const yandexUrl = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(address)}&results=5`
          const yandexResponse = await fetch(yandexUrl)
          if (yandexResponse.ok) {
            const yandexData = await yandexResponse.json()
            const features = yandexData?.response?.GeoObjectCollection?.featureMember || []
            const yandexSuggestions = features.map((item: any, index: number) => ({
              value: item.GeoObject.metaDataProperty.GeocoderMetaData.text,
              data: {
                geo_lat: item.GeoObject.Point.pos.split(' ')[1],
                geo_lon: item.GeoObject.Point.pos.split(' ')[0]
              }
            }))
            setSuggestions(yandexSuggestions)
          } else {
            setSuggestions([])
          }
        }
      } catch (error) {
        console.warn('Geocoding error:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
    
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [address])

  function selectSuggestion(suggestion: { value: string, data: { geo_lat: string, geo_lon: string } }){
    onAddressChange(suggestion.value)
    onPointChange({ 
      lon: parseFloat(suggestion.data.geo_lon), 
      lat: parseFloat(suggestion.data.geo_lat) 
    })
    setSuggestions([])
  }

  return (
    <div style={{ position: 'relative' }}>
      <input 
        placeholder="Введите адрес" 
        value={address} 
        onChange={e => onAddressChange(e.target.value)}
        style={{ width: '100%' }}
      />
      {loading && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--muted)' }}>...</div>}
      {suggestions.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          left: 0, 
          right: 0, 
          top: 48, 
          background: 'var(--card)', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: 12, 
          zIndex: 20, 
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {suggestions.map((s, index) => (
            <div 
              key={index} 
              onClick={() => selectSuggestion(s)} 
              style={{ 
                padding: '12px 16px', 
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                fontSize: 14
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {s.value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}