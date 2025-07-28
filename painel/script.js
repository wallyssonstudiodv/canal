const form = document.getElementById('formulario');
const lista = document.getElementById('lista');

form.addEventListener('submit', e => {
  e.preventDefault();

  const videoId = document.getElementById('videoId').value.trim();
  const hora = document.getElementById('hora').value.trim();
  const grupos = document.getElementById('grupos').value.trim().split('\n').map(x => x.trim());

  const novo = { videoId, hora, grupos };

  fetch('/dados/config.json')
    .then(res => res.json())
    .then(dados => {
      dados.envios.push(novo);
      return fetch('/dados/config.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados, null, 2)
      });
    })
    .then(() => {
      alert('Agendamento adicionado!');
      location.reload();
    })
    .catch(err => alert('Erro ao salvar: ' + err.message));
});

window.onload = () => {
  fetch('/dados/config.json')
    .then(res => res.json())
    .then(dados => {
      dados.envios.forEach(envio => {
        const li = document.createElement('li');
        li.textContent = `Vídeo: ${envio.videoId} - Hora: ${envio.hora} - Grupos: ${envio.grupos.join(', ')}`;
        lista.appendChild(li);
      });
    });
};

// ---- Receber e mostrar QR Code ----
const socket = io();
socket.on('qr', (qr) => {
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';
  const img = document.createElement('img');
  img.src = 'https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(qr) + '&size=200x200';
  qrDiv.appendChild(img);
});