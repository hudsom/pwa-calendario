export function getGoogleCalendarUrl(task) {
  // Verificar se task.hora existe e é válido
  if (!task.hora || typeof task.hora !== 'string') {
    return '#'; // Retorna link vazio se não há hora válida
  }
  
  const title = encodeURIComponent(task.title);
  const details = encodeURIComponent(`Tarefa: ${task.title}`);
  const [h, m] = task.hora.split(':');
  
  // Verificar se h e m são números válidos
  if (!h || !m || isNaN(h) || isNaN(m)) {
    return '#'; // Retorna link vazio se hora é inválida
  }
  
  const now = new Date();
  // Cria a data/hora de início do evento usando a data de hoje e a hora da tarefa
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(h), parseInt(m));
  
  // Verificar se a data criada é válida
  if (isNaN(start.getTime())) {
    return '#'; // Retorna link vazio se data é inválida
  }
  
  // Cria a data/hora de término do evento, 15 minutos após o início
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  
  // Função para formatar a data no padrão exigido pelo Google Calendar (YYYYMMDDTHHmmssZ)
  const fmt = d => {
    try {
      return d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    } catch (error) {
      return ''; // Retorna string vazia se erro na formatação
    }
  };
  
  const startFormatted = fmt(start);
  const endFormatted = fmt(end);
  
  // Verificar se as datas foram formatadas corretamente
  if (!startFormatted || !endFormatted) {
    return '#'; // Retorna link vazio se formatação falhou
  }
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${details}`;
}