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
      <div style={{ 
        background: 'rgba(60, 70, 90, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: 20,
        borderLeft: '4px solid #667eea',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>📊 Suas Tarefas</h3>
        
        {/* Divs lado a lado para tarefas */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ background: 'rgba(240, 242, 247, 0.9)', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{analyticsData.totalTasks || 0}</div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Criadas</div>
          </div>
          <div style={{ background: 'rgba(240, 242, 247, 0.9)', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>{analyticsData.totalCompletedTasks || 0}</div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Concluídas</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {completedTasks.length > 0 ? (
            completedTasks.map(task => (
              <div key={task.id} style={{ 
                background: 'rgba(200, 255, 200, 0.9)', 
                padding: '12px', 
                borderRadius: '6px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'black', marginBottom: '4px' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '14px', color: 'black' }}>
                    {task.hora || 'Sem horário'}
                  </div>
                </div>
                <button
                  style={{ 
                    background: 'none', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '4px', 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}
                  onClick={() => onShareTask && onShareTask(task)}
                >
                  <span role="img" aria-label="share">🔗</span> 
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

      <div style={{ 
        background: 'rgba(60, 70, 90, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: 20,
        borderLeft: '4px solid #667eea',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h3 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>👤 Histórico de acessos</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(240, 242, 247, 0.9)', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
              {analyticsData.totalLogins || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Total</div>
          </div>
          <div style={{ background: 'rgba(240, 242, 247, 0.9)', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
              {analyticsData.loginDays?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Em dias</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ background: 'rgba(240, 242, 247, 0.9)', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2196f3' }}>
              {formatDateSeparated(analyticsData.lastLogin).date}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2196f3' }}>
              {formatDateSeparated(analyticsData.lastLogin).time}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Último</div>
          </div>
          <div style={{ background: 'rgba(240, 242, 247, 0.9)', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00bcd4' }}>
              {formatDateSeparated(analyticsData.createdAt).date}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#00bcd4' }}>
              {formatDateSeparated(analyticsData.createdAt).time}
            </div>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Primeiro</div>
          </div>
        </div>
      </div>


    </>
  );
};

export default AnalyticsReports;