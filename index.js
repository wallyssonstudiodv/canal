const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    PHONENUMBER_MCC
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

let configPath = path.join(__dirname, 'dados', 'config.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'painel')));
app.use('/dados', express.static(path.join(__dirname, 'dados')));

let qrSocket = null;
io.on('connection', (socket) => {
    console.log('[PAINEL] Conectado');
    qrSocket = socket;
});

server.listen(3000, () => {
    console.log('[🌐] Painel disponível em: http://localhost:3000');
});

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, fs)
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && qrSocket) {
            qrSocket.emit('qr', qr);
        }

        if (connection === 'close') {
            const motivo = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log('[⚠️] Conexão encerrada:', motivo);
            if (motivo !== 401) {
                iniciarBot();
            } else {
                console.log('[❌] Autenticação inválida. Delete a pasta "auth" e escaneie novamente.');
            }
        } else if (connection === 'open') {
            console.log('[✅] Conectado com sucesso!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    setInterval(async () => {
        const horaAtual = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

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