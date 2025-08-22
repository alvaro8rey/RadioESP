const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/hls', (req, res) => {
    const mp3Url = req.query.url;
    if (!mp3Url) {
        console.log('Error: falta parámetro URL');
        return res.status(400).send('Falta parámetro URL');
    }

    console.log('Solicitado MP3:', mp3Url);

    const outputDir = '/tmp/hls-temp';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const playlist = path.join(outputDir, 'playlist.m3u8');
    if (fs.existsSync(playlist)) fs.unlinkSync(playlist);

    console.log('Iniciando FFmpeg...');

    ffmpeg(mp3Url)
        .outputOptions([
            '-c:a aac',
            '-b:a 128k',
            '-f hls',
            '-hls_time 10',
            '-hls_list_size 6',
            '-hls_flags delete_segments'
        ])
        .output(playlist)
        .on('start', (commandLine) => {
            console.log('FFmpeg start:', commandLine);
        })
        .on('progress', (progress) => {
            console.log('Progreso FFmpeg:', progress);
        })
        .on('end', () => {
            console.log('HLS generado correctamente en:', playlist);
            res.sendFile(playlist);
        })
        .on('error', (err) => {
            console.error('Error FFmpeg:', err);
            res.status(500).send('Error generando HLS');
        })
        .run();
});



app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
