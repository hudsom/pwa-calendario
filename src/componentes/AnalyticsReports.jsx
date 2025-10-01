import { useState, useEffect } from 'react';
import { getUserAnalytics } from '../utils/analytics';
import { useAuth } from '../context/AuthContext';

const AnalyticsReports = () => {
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

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px 0' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Relatórios do Firebase Analytics</h2>
      


      {/* Relatório de Engajamento */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '6px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#1976d2', marginBottom: '10px' }}>📊 Suas Tarefas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>{analyticsData.totalTasks || 0}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Tarefas criadas</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9c27b0' }}>{analyticsData.totalCompletedTasks || 0}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Tarefas concluídas</div>
          </div>
        </div>
      </div>

      {/* Relatório de Usuários */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#1976d2', marginBottom: '10px' }}>👤 Histórico</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>
              {analyticsData.totalLogins || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total de logins</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>
              {analyticsData.weeklyLogins || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Logins esta semana</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2196f3' }}>
              {formatDate(analyticsData.lastLogin)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Último login</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00bcd4' }}>
              {formatDate(analyticsData.createdAt)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Conta criada em</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsReports;