import { useMemo, useState } from 'react'

const DEFAULT_CATEGORIES = [
  'IT','Музыка','Спорт','Кино','Искусство','Образование','Бизнес','Стартапы','Танцы','Языки',
  'Театр','Фотография','Йога','Фитнес','Бег','Велоспорт','Единоборства','Настолки','Видеоигры','Кулинария',
  'Вино','Кофе','Путешествия','Туризм','Походы','Психология','Саморазвитие','Нетворкинг','Маркетинг','Продажи',
  'Дизайн','UX/UI','Фронтенд','Бэкенд','Мобильная разработка','Data Science','ML/AI','Кибербезопасность','DevOps','Cloud',
  'Стартап-питчи','Инвестиции','Финансы','Бухгалтерия','Право','HR','Рекрутинг','Общественные инициативы','Благотворительность','Волонтёрство',
  'Книги','Поэзия','Иностранные языки','История','Наука','Астрономия','Философия','Экология','Город','Архитектура'
]

export default function CategorySelector({ value = [], onChange }:{ value?: string[], onChange?: (v:string[])=>void }){
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>(value)
  const [showAll, setShowAll] = useState(false)
  const all = DEFAULT_CATEGORIES
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(c => c.toLowerCase().includes(q) || selected.includes(c))
  }, [query, selected])

  const VISIBLE_COUNT = 12 // примерно 2 строки чипов
  const visible = showAll ? filtered : filtered.slice(0, VISIBLE_COUNT)
  const hasMore = filtered.length > VISIBLE_COUNT

  function toggle(cat: string) {
    const next = selected.includes(cat) ? selected.filter(c => c!==cat) : [...selected, cat]
    setSelected(next)
    onChange && onChange(next)
  }

  return (
    <div>
      <input placeholder="Поиск категории" value={query} onChange={e=>setQuery(e.target.value)} />
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
        {visible.map(c => (
          <button key={c} onClick={()=>toggle(c)} style={{ padding:'8px 10px', borderRadius:999, background: selected.includes(c) ? 'var(--accent)' : 'rgba(255,255,255,0.06)', color: selected.includes(c) ? '#000' : 'var(--text)' }}>
            {c}
          </button>
        ))}
        {!showAll && hasMore && (
          <button onClick={()=>setShowAll(true)} style={{ padding:'8px 10px', borderRadius:999, background:'rgba(255,255,255,0.06)', color:'var(--text)' }}>Показать ещё</button>
        )}
        {showAll && hasMore && (
          <button onClick={()=>setShowAll(false)} style={{ padding:'8px 10px', borderRadius:999, background:'rgba(255,255,255,0.06)', color:'var(--text)' }}>Скрыть</button>
        )}
      </div>
    </div>
  )
}


