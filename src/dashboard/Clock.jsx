import { useEffect, useState } from "react"

export const Clock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

  const formatDate = (date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-[10px] md:text-base lg:text-base font-bold">{formatTime(time)}</span>
      <span className="text-sm text-[10px] md:text-base lg:text-base opacity-70">{formatDate(time)}</span>
    </div>
  )
}
