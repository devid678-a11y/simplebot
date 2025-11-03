import { useState, useEffect, useRef } from 'react'

const AnimatedNumber = ({ value, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const numericValue = parseInt(value.replace(/\D/g, ''))
    const start = 0
    const increment = numericValue / (duration / 16)
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, value, duration])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

export default AnimatedNumber

