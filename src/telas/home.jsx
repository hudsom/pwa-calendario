import { useState } from 'react'
import '../App.css'

function Home({ tasks, setTasks }) {
  const [newTask, setNewTask] = useState({ title: '', time: '', completed: false })
  const [editingTask, setEditingTask] = useState(null)

  const addTask = () => {
    if (!newTask.title) {
      alert('Por favor, insira o título da tarefa!')
      return
    }
    if (!newTask.time) {
      alert('Por favor, selecione o horário da tarefa!')
      return
    }
    
    const now = new Date()
    const taskTime = new Date()
    const [hours, minutes] = newTask.time.split(':')
    taskTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    if (taskTime < now) {
      alert('Não é possível adicionar tarefas para horários anteriores!')
      return
    }
    
    const existingTask = tasks.find(task => task.time === newTask.time)
    if (existingTask) {
      const proceed = confirm(`Já existe uma tarefa no horário ${newTask.time}: "${existingTask.title}". Deseja prosseguir mesmo assim?`)
      if (!proceed) {
        return
      }
    }
    
    setTasks([...tasks, { ...newTask, id: Date.now() }])
    setNewTask({ title: '', time: '', completed: false })
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const editTask = (task) => {
    setEditingTask(task)
  }

  const saveTask = () => {
    setTasks(tasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    ))
    setEditingTask(null)
  }

  return (
    <div className="screen-container">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <span style={{ marginRight: 15 }}>Usuário logado: {currentUser?.email}</span>
            </div>

      <div className="screen-header">
        <h1 className="screen-title">Minhas Tarefas</h1>ßß
      </div>

      <div className="form-container">
        <div className="form-group">
          <input
            type="text"
            placeholder="Título da tarefa"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            type="time"
            value={newTask.time}
            onChange={(e) => setNewTask({...newTask, time: e.target.value})}
            className="form-input"
          />
        </div>
        <button onClick={addTask} className="form-button">
          Adicionar Tarefa
        </button>
      </div>
      
      <div className="content-section">
        <h2 className="section-title">Tarefas do Dia</h2>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">Nenhuma tarefa adicionada</div>
          </div>
        ) : (
          tasks.sort((a, b) => a.time.localeCompare(b.time)).map(task => (
            <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
              {editingTask && editingTask.id === task.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    className="form-input"
                  />
                  <input
                    type="time"
                    value={editingTask.time}
                    onChange={(e) => setEditingTask({...editingTask, time: e.target.value})}
                    className="form-input"
                  />
                  <div className="edit-buttons">
                    <button onClick={saveTask} className="btn-save">Salvar</button>
                    <button onClick={() => setEditingTask(null)} className="btn-cancel">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="task-content">
                  <div className="task-info">
                    <div className="task-time">{task.time}</div>
                    <div className="task-title">{task.title}</div>
                  </div>
                  <div className="task-actions">
                    <button onClick={() => editTask(task)} className="btn-small btn-edit">
                      Editar
                    </button>
                    <button 
                      onClick={() => toggleTask(task.id)} 
                      className={`btn-small ${task.completed ? 'btn-undo' : 'btn-complete'}`}
                    >
                      {task.completed ? 'Desfazer' : 'Concluir'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Home