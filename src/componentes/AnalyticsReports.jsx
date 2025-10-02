import { useState, useEffect } from 'react';
import { getUserAnalytics } from '../utils/analytics';
import { useAuth } from '../context/AuthContext';

const AnalyticsReports = ({ completedTasks = [], onShareTask }) => {
  const { currentUser } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      if (currentUser) {
        try {
          const data = await getUserAnalytics(currentUser.uid);
          setAnalyticsData(data);
        } catch (error) {
          console.error('Erro ao carregar analytics:', error);
        }
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Carregando dados...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Erro ao carregar dados de analytics</div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  const formatDateSeparated = (timestamp) => {
    if (!timestamp) return { date: 'Nunca', time: '' };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  return (
    <>
      <div className="task-card" style={{ marginBottom: 20, background: 'rgba(50, 60, 80, 0.95)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f8fafc', marginBottom: '24px', textAlign: 'center' }}>📊 Suas Tarefas</h3>
        
        {/* Divs lado a lado para tarefas */}
        <div className="stats-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '15px' }}>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#ff9800' }}>{analyticsData.totalTasks || 0}</div>
            <div className="stat-label">Criadas</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#9c27b0' }}>{analyticsData.totalCompletedTasks || 0}</div>
            <div className="stat-label">Concluídas</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {completedTasks.length > 0 ? (
            completedTasks.map(task => (
              <div key={task.id} style={{ 
                background: 'rgba(165, 180, 252, 0.25)', 
                padding: '12px', 
                borderRadius: '6px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(165, 180, 252, 0.3)'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '14px', color: 'white' }}>
                    {task.hora || 'Sem horário'}
                  </div>
                </div>
                <button
                  className="btn-small"
                  style={{ background: 'rgba(102, 126, 234, 0.8)', fontSize: '16px' }}
                  onClick={() => onShareTask && onShareTask(task)}
                >
                  🔗
                </button>
              </div>
            ))
          ) : (
            <div style={{ 
              background: 'rgba(240, 242, 247, 0.9)', 
              padding: '15px', 
              borderRadius: '6px', 
              textAlign: 'center',
              color: '#666',
              fontSize: '14px'
            }}>
              Nenhuma tarefa concluída
            </div>
          )}
        </div>
      </div>

      <div className="task-card" style={{ marginBottom: 20, background: 'rgba(50, 60, 80, 0.95)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f8fafc', marginBottom: '24px', textAlign: 'center' }}>👤 Histórico de acessos</h3>
        
        <div className="stats-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '10px' }}>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#4caf50' }}>
              {analyticsData.totalLogins || 0}
            </div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#f44336' }}>
              {analyticsData.loginDays?.length || 0}
            </div>
            <div className="stat-label">Em dias</div>
          </div>
        </div>
        
        <div className="stats-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '15px' }}>
          <div className="stat-card">
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2196f3' }}>
              {formatDateSeparated(analyticsData.lastLogin).date}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2196f3' }}>
              {formatDateSeparated(analyticsData.lastLogin).time}
            </div>
            <div className="stat-label">Último</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00bcd4' }}>
              {formatDateSeparated(analyticsData.createdAt).date}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00bcd4' }}>
              {formatDateSeparated(analyticsData.createdAt).time}
            </div>
            <div className="stat-label">Primeiro</div>
          </div>
        </div>
      </div>


    </>
  );
};

export default AnalyticsReports;