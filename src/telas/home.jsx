import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from "uuid"
import { addTask, getTasks, updateTask, syncPendingTasks, deleteTask } from '../utils/db'
import { trackPageView, trackUserTaskCreated, trackUserTaskCompleted } from '../utils/firebase'
import { getUserLocation, listenTaskByVoice } from '../utils/native'
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'
import OfflineIndicator from '../componentes/OfflineIndicator'
import '../App.css'

function Home() {
  const { currentUser, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [hora, setHora] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHora, setEditHora] = useState("");
  const [adding, setAdding] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);


  useEffect(() => {
    trackPageView('Home');
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
      console.error('Erro ao fazer logout:', err);
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
      await trackUserTaskCreated(currentUser.uid);
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

  async function loadTasks(skipFirebaseSync = false) {
    try {
      const userTasks = await getTasks(currentUser.uid, skipFirebaseSync);
      userTasks.sort((a, b) => {
        if (!a.hora && !b.hora) return 0;
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
      });
      console.log('Tarefas carregadas:', userTasks.length);
      setTasks(userTasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
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
    if (savingEdit) return;
    
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
    
    setSavingEdit(true);
    try {
      await updateTask(editingId, { title: editTitle, hora: editHora });
      await loadTasks();
      setEditingId(null);
      setEditTitle("");
      setEditHora("");
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      alert('Erro ao salvar tarefa');
    } finally {
      setSavingEdit(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditHora("");
  }

  async function handleDeleteTask(taskId) {
    if (deletingTask === taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Tarefa não encontrada:', taskId);
      return;
    }
    
    if (task.done) return;
    
    const confirmed = confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`);
    if (!confirmed) return;
    
    console.log('Excluindo tarefa:', taskId);
    setDeletingTask(taskId);
    try {
      await deleteTask(taskId);
      console.log('Tarefa excluída com sucesso');
      await loadTasks(true);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      alert('Erro ao excluir tarefa: ' + error.message);
    } finally {
      setDeletingTask(null);
    }
  }

  async function toggleTaskStatus(taskId) {
    if (completingTask === taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    
    if (task.done && task.hora) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      if (task.hora < currentTime) {
        const proceed = confirm('Esta tarefa tem horário no passado. Deseja prosseguir mesmo assim?');
        if (!proceed) return;
      }
    }
    
    setCompletingTask(taskId);
    try {
      await updateTask(taskId, { done: !task.done });
      if (!task.done) await trackUserTaskCompleted(currentUser.uid);
      await loadTasks();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    } finally {
      setCompletingTask(null);
    }
  }
  
  return (
    <div className="main-container">
      <div className="screen-container">
      <OfflineIndicator />
      <nav style={{ padding: '12px', background: 'rgba(50, 60, 80, 0.95)' }}>
        <Link to="/dashboard" className="nav-link" style={{ padding: '10px 16px', fontSize: '13px', background: 'rgba(102, 126, 234, 0.8)', color: 'white' }}>
          Ir para Dashboard
        </Link>
        <button onClick={handleLogout} className="logout" style={{ padding: '10px 16px', fontSize: '13px' }}>
          Logout
        </button>
      </nav>
      <div className="screen-header">
        <h1 className="screen-title">Tarefas do dia</h1>
        <div className="screen-subtitle">Usuário logado: {currentUser?.email}</div>
      </div>
      <div className="task-card" style={{ marginBottom: 20, background: 'rgba(50, 60, 80, 0.95)' }}>
        <div className="form-container">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f8fafc', marginBottom: '24px', textAlign: 'center' }}>📝 Nova Tarefa</h3>
        <div className="form-group">
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da tarefa"
          />
        </div>
        <div className="form-group">
          <input
            className="form-input"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            style={{ direction: 'rtl' }}
          />
        </div>
        <button 
          onClick={handleAdd} 
          disabled={adding}
          className="form-button"
          style={{ 
            background: adding ? '#6b7280' : undefined,
            cursor: adding ? 'not-allowed' : undefined
          }}
        >
          {adding ? 'Adicionando...' : 'Adicionar Tarefa'}
        </button>
        <button onClick={handleVoiceAdd} className="form-button" style={{ background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)', marginTop: '12px' }}>Adicionar Tarefa por voz</button>
        </div>
      </div>
      <ul className="task-list" style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map(t =>(
          <li className="task-card" key={t.id} style={{ position: 'relative', background: t.done ? 'rgba(40, 50, 70, 0.9)' : 'rgba(50, 60, 80, 0.95)' }}>
            <div style={{ fontSize: '11px', color: t.synced ? '#10b981' : '#ffd600', textAlign: 'right', marginBottom: '4px' }}>
              {t.synced ? 'Sincronizada' : 'Não sincronizada'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <span style={{ fontWeight: 'bold', color: 'white', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
              <span style={{ fontWeight: 'normal', color: 'white', textDecoration: t.done ? 'line-through' : 'none', textAlign: 'right' }}>{t.hora || ""}</span>
            </div>
            {t.location && (
              <div style={{ color: '#2196f3', fontSize: '0.9em', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Lat/Long:</strong></span>
                <span>{t.location.lat?.toFixed(5)}, {t.location.lng?.toFixed(5)}</span>
              </div>
            )}
            {editingId === t.id ? (
              <div className="edit-form">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="form-input"
                />
                <input
                  type="time"
                  value={editHora}
                  onChange={(e) => setEditHora(e.target.value)}
                  className="form-input"
                  style={{ direction: 'rtl' }}
                />
                <div className="edit-buttons">
                  <button 
                    onClick={saveEdit} 
                    disabled={savingEdit}
                    className="btn-save"
                    style={{ 
                      background: savingEdit ? '#6b7280' : undefined,
                      cursor: savingEdit ? 'not-allowed' : undefined
                    }}
                  >
                    {savingEdit ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={cancelEdit} className="btn-cancel">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="task-actions">
                <button 
                  onClick={() => startEdit(t)} 
                  disabled={t.done}
                  className="btn-small btn-edit"
                  style={{ 
                    background: t.done ? '#ccc' : undefined,
                    cursor: t.done ? 'not-allowed' : undefined,
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteTask(t.id)}
                  disabled={t.done || deletingTask === t.id}
                  className="btn-small"
                  style={{ 
                    background: t.done || deletingTask === t.id ? '#ccc' : '#ef4444',
                    color: 'white',
                    cursor: t.done || deletingTask === t.id ? 'not-allowed' : undefined,
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  {deletingTask === t.id ? 'Excluindo...' : 'Excluir'}
                </button>
                <button 
                  onClick={() => toggleTaskStatus(t.id)}
                  disabled={completingTask === t.id}
                  className={`btn-small ${t.done ? 'btn-undo' : 'btn-complete'}`}
                  style={{ 
                    background: completingTask === t.id ? '#6b7280' : undefined,
                    cursor: completingTask === t.id ? 'not-allowed' : undefined,
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  {completingTask === t.id ? 'Processando...' : (t.done ? 'Desfazer' : 'Concluir')}
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