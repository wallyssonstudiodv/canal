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
      dados.envios.forEach(tarefa => {
        const item = document.createElement('li');
        item.textContent = `📺 ${tarefa.videoId} - 🕒 ${tarefa.hora}`;
        lista.appendChild(item);
      });
    });
};