import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'

function App() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      window.location.href = '/login';
    } else {
      window.location.href = '/home';
    }
  }, []);

  return null;
}

export default App