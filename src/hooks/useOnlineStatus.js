import { useState, useEffect, useRef } from 'react'

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const wasOfflineRef = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      
      if (wasOfflineRef.current) {
        setShowOfflineMessage(true)
        timeoutRef.current = setTimeout(() => {
          setShowOfflineMessage(false)
        }, 3000)
      }
      wasOfflineRef.current = false
    }

    const handleOffline = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setIsOnline(false)
      setShowOfflineMessage(true)
      wasOfflineRef.current = true
    }

    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'online') {
        handleOnline()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Escuta mensagens do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
    }
  }, [])

  return { isOnline, showOfflineMessage }
}