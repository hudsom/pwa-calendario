import React from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import './OfflineIndicator.css'

const OfflineIndicator = () => {
  const { isOnline, showOfflineMessage } = useOnlineStatus()

  if (isOnline && !showOfflineMessage) {
    return null
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'back-online' : 'offline'}`}>
      <div className="offline-content">
        {isOnline ? (
          <>
            <span>Conexão restaurada!</span>
          </>
        ) : (
          <>
            <span>Modo Offline - Funcionalidade limitada</span>
          </>
        )}
      </div>
    </div>
  )
}

export default OfflineIndicator