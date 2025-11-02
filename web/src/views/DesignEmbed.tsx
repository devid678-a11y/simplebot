import { useEffect, useRef } from 'react'

export default function DesignEmbed() {
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return
    const adjust = () => {
      try {
        const d = iframe.contentWindow!.document
        const h = Math.max(
          d.body.scrollHeight,
          d.documentElement.scrollHeight,
          d.body.offsetHeight,
          d.documentElement.offsetHeight
        )
        if (h) iframe.style.height = h + 'px'
      } catch {}
    }
    const onLoad = () => {
      adjust()
      // несколько подстроек после загрузки
      let ticks = 0
      const id = setInterval(() => { adjust(); if (++ticks > 12) clearInterval(id) }, 400)
      try { iframe.contentWindow!.addEventListener('resize', adjust) } catch {}
    }
    iframe.addEventListener('load', onLoad)
    return () => {
      iframe.removeEventListener('load', onLoad)
      try { iframe.contentWindow!.removeEventListener('resize', adjust) } catch {}
    }
  }, [])

  return (
    <div style={{ padding: 0 }}>
      <div style={{ width: 390, maxWidth: '100%', margin: '0 auto' }}>
      <iframe
        ref={ref}
        src={import.meta.env.BASE_URL + 'static-design/33/index.html'}
          style={{ width: '100%', border: '0', display: 'block', background: '#000' }}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
      </div>
    </div>
  )
}


