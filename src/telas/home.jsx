import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from "uuid"
import { addTask, getTasks, updateTask, syncPendingTasks } from '../utils/db'
import { getUserLocation, copyTaskToClipboard, listenTaskByVoice } from '../utils/native'
import { getGoogleCalendarUrl } from '../utils/calendar'
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'
import { syncTasks } from '../utils/sync'
import OfflineIndicator from '../componentes/OfflineIndicator'
import { useRegisterSW } from 'virtual:pwa-register/react'
import '../App.css'

function Home() {
  const { currentUser, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [hora, setHora] = useState("");
  const [done, setDone] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHora, setEditHora] = useState("");
  const [adding, setAdding] = useState(false);

  const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registrado: ' + r)
    },
    onRegisterError(error) {
      console.log('Erro no registro do SW', error)
    },
  })

  useEffect(() => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
  }, [currentUser]);

  function updateAppBadge(pendingCount) {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(pendingCount);
    } else if ('setExperimentalAppBadge' in navigator) {
      navigator.setExperimentalAppBadge(pendingCount);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      console.error("Erro ao fazer logout " + err);
    }
  }

  useEffect(() => {
    loadTasks();
    syncPendingTasks();
    
    const handleOnline = () => {
      syncPendingTasks();
      loadTasks();
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', loadTasks);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', loadTasks);
    }
  }, [])

  useEffect(() => {
    const pending = tasks.filter(t => !t.done).length;
    updateAppBadge(pending);
  }, [tasks]);

  async function syncAndReload() {
    await syncTasks();
    await loadTasks();
  }

  async function handleAdd() {
    if (adding) return;
    
    if (!title.trim()) {
      alert('É obrigatório informar um título!');
      return;
    }
    
    if (!hora) {
      alert('É obrigatório informar um horário!');
      return;
    }
    
    if (tasks.some(t => t.hora === hora)) {
      alert('Já existe uma tarefa para este horário!');
      return;
    }
    
    setAdding(true);
    try {
      const location = await getUserLocation();
      const task = {
        id: uuidv4(),
        title: title.trim(), 
        hora,
        done: false,
        lastUpdated: Date.now(),
        synced: false,
        location,
        userId: currentUser.uid
      }
      
      await addTask(task);
      setTitle("");
      setHora("");
      await loadTasks();
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      alert('Erro ao adicionar tarefa');
    } finally {
      setAdding(false);
    }
  }

  async function loadTasks() {
    const userTasks = await getTasks(currentUser.uid);
    userTasks.sort((a, b) => {
      if (!a.hora && !b.hora) return 0;
      if (!a.hora) return 1;
      if (!b.hora) return -1;
      return a.hora.localeCompare(b.hora);
    });
    setTasks(userTasks);
  }

  function handleVoiceAdd() {
    listenTaskByVoice(
      (transcript) => {
        setTitle(transcript);
        setTimeout(() => {
          const el = document.querySelector('input.styled-input');
          if (el) el.focus();
        }, 100);
      },
      (err) => {
        alert('Erro no reconhecimento de voz: ' + err);
      }
    );
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditHora(task.hora);
  }

  async function saveEdit() {
    if (!editHora) {
      alert('É obrigatório informar um horário para a tarefa!');
      return;
    }
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    if (editHora < currentTime) {
      alert('Não é possível incluir uma tarefa com horário no passado!');
      return;
    }
    
    if (tasks.some(t => t.hora === editHora && t.id !== editingId)) {
      alert('Já existe uma tarefa para este horário!');
      return;
    }
    
    await updateTask(editingId, { title: editTitle, hora: editHora });
    await loadTasks();
    setEditingId(null);
    setEditTitle("");
    setEditHora("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditHora("");
  }

  async function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    
    if (task.done && task.hora) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      if (task.hora < currentTime) {
        const proceed = confirm('Esta tarefa tem horário no passado. Deseja prosseguir mesmo assim?');
        if (!proceed) return;
      }
    }
    
    await updateTask(taskId, { done: !task.done });
    await loadTasks();
  }
  
  return (
    <div className="main-container">
      <div className="screen-container">
      <OfflineIndicator />
      <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
        <Link to="/dashboard" style={{ flex: 1 }}>
          <button style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', width: '100%' }}>Ir para o dashboard</button>
        </Link>
        <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Logout</button>
      </div>
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <span>Usuário logado: {currentUser?.email}</span>
      </div>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Minhas tarefas</h1>
      <div className="task-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 15, color: 'white' }}>Nova Tarefa</h3>
        <input
          className="styled-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          style={{ marginBottom: 15, display: 'block', width: '100%', padding: '8px', fontSize: '14px' }}
        />
        <input
          className="styled-input"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          style={{ marginBottom: 20, display: 'block', width: '100%', padding: '8px', fontSize: '14px', direction: 'rtl' }}
        />
        <button 
          onClick={handleAdd} 
          disabled={adding}
          className="styled-input" 
          style={{ 
            background: adding ? '#6b7280' : '#10b981', 
            color: '#fff', 
            fontWeight: 'bold', 
            width: '100%',
            cursor: adding ? 'not-allowed' : 'pointer'
          }}
        >
          {adding ? 'Adicionando...' : 'Adicionar Tarefa'}
        </button>
        <div style={{ marginTop: '10px' }}></div>
        <button onClick={handleVoiceAdd} className="styled-input" style={{ background: '#ff9800', color: '#fff', fontWeight: 'bold', width: '100%' }}>Adicionar Tarefa por voz</button>
      </div>
      <ul className="task-list" style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map(t =>(
          <li className="task-card" key={t.id} style={{ position: 'relative', backgroundColor: t.done ? 'rgba(200, 210, 220, 0.8)' : undefined }}>
            <div style={{ fontSize: '11px', color: t.synced ? '#10b981' : '#ffd600', textAlign: 'right', marginBottom: '4px' }}>
              {t.synced ? 'Sincronizada' : 'Não sincronizada'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontWeight: 'bold', color: 'white', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
              <span style={{ fontWeight: 'normal', color: 'white', textDecoration: t.done ? 'line-through' : 'none', paddingRight: '20px' }}>{t.hora || ""}</span>
            </div>
            {t.location && (
              <div style={{ color: '#2196f3', fontSize: '0.9em', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Lat/Long:</strong></span>
                <span>{t.location.lat?.toFixed(5)}, {t.location.lng?.toFixed(5)}</span>
              </div>
            )}
            {editingId === t.id ? (
              <div>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="time"
                  value={editHora}
                  onChange={(e) => setEditHora(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveEdit} style={{ fontSize: '0.9em', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', flex: 1 }}>Salvar</button>
                  <button onClick={cancelEdit} style={{ fontSize: '0.9em', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', flex: 1 }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', marginTop: 8 }}>
                <button 
                  onClick={() => startEdit(t)} 
                  disabled={t.done}
                  style={{ 
                    fontSize: '0.9em', 
                    background: t.done ? '#ccc' : '#f59e0b', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4, 
                    padding: '6px 12px', 
                    cursor: t.done ? 'not-allowed' : 'pointer', 
                    flex: 1 
                  }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => toggleTaskStatus(t.id)}
                  style={{ fontSize: '0.9em', background: t.done ? '#f59e0b' : '#10b981', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', flex: 1 }}
                >
                  {t.done ? 'Desfazer' : 'Concluir'}
                </button>
              </div>
            )}
          </li>
        ))}

      </ul>
      </div>
    </div>
  )
}

export default Home