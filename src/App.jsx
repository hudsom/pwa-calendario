import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'

function App() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    } else {
      window.location.href = '/home';
    }
  }, [currentUser]);

  return null;
}

export default App