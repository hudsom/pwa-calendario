export async function shareTask(task) {
  if (navigator.share) {
    try {
      const text = `Tarefa: ${task.title}\nHora: ${task.hora || ''}\nConcluída: ${task.done ? 'Sim' : 'Não'}${task.location ? `\nLocalização: ${task.location.lat}, ${task.location.lng}` : ''}`;
      const shareData = {
        title: task.title || 'Tarefa',
        text: text,
      };
      await navigator.share(shareData);
    } catch (error) {
      console.error('Erro ao compartilhas tarefa:', error);
    }
  } else {
    console.error('Web Share API não suportada neste dispositivo.');
  }  
}

export async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ lat: latitude, lng: longitude });
          },
          (error) => {
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error('Geolocalização não suportada'));
    }
  });
}

export function exportTasksToJson(tasks) {
  const dataStr = JSON.stringify(tasks, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-export-${Date.now}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('Tarefas exportadas com sucesso!');
}

export async function copyTaskToClipboard(task) {
  const text = `Tarefa: ${task.title}\nHora: ${task.hora || ''}\nConcluída: ${task.done ? 'Sim' : 'Não'}${task.location ? `\nLocalização: ${task.location.lat}, ${task.location.lng}` : ''}`;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Tarefa copiada para a área de transferência!');
  } catch (error) {
    console.error('Erro ao copiar tarefa:', error);
  }
}

export function listenTaskByVoice(onResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition){
        onError && onError('Reconhecimento d voz não suportado.');
        return null;
  }else{
    try{
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        onResult(transcript)
     };
      recognition.onerror = (event) => {
      onError && onError(event.error);
      };
    recognition.start();
    return recognition;
    }catch(error){
      onError && onError(error);
      return null;
    }
  }
}