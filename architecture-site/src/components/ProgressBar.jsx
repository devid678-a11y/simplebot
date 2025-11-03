import { useState, useEffect } from 'react'
import './ProgressBar.css'

const ProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const updateScrollProgress = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollableHeight = documentHeight - windowHeight
      const progress = (scrollTop / scrollableHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', updateScrollProgress)
    updateScrollProgress()

    return () => window.removeEventListener('scroll', updateScrollProgress)
  }, [])

  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar" 
        style={{ width: `${scrollProgress}%` }}
      ></div>
    </div>
  )
}

export default ProgressBar

