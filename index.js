const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const { state, saveState } = useSingleFileAuthState('./auth.json');

let configPath = path.join(__dirname, 'dados', 'config.json');
let config = JSON.parse(fs.readFileSync(configPath));

async function iniciarBot() {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        version
    });

    sock.ev.on('connection.update', update => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const motivo = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (motivo !== 401) {
                iniciarBot();
            }
        }
    });

    sock.ev.on('creds.update', saveState);

    setInterval(async () => {
        const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const configAtualizada = JSON.parse(fs.readFileSync(configPath));
        for (const tarefa of configAtualizada.envios) {
            if (tarefa.hora === horaAtual) {
                try {
                    const resposta = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${tarefa.videoId}&format=json`);
                    const titulo = resposta.data.title;
                    for (const grupo of tarefa.grupos) {
                        await sock.sendMessage(grupo, {
                            text: `🎥 *${titulo}*\n🔗 https://www.youtube.com/watch?v=${tarefa.videoId}`
                        });
                    }
                } catch (err) {
                    console.error('Erro ao enviar vídeo:', err.message);
                }
            }
        }
    }, 60000);
}

iniciarBot(); 