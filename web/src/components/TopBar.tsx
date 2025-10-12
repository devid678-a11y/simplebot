export default function TopBar({ title = 'Meetups' }: { title?: string }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>Mini‑app</div>
      </div>
    </div>
  )
}


