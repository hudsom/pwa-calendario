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
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar tarefa:', error);
      }
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