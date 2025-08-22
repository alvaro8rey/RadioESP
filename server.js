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
    if (!mp3Url) return res.status(400).send('Falta parámetro URL');

    const outputDir = path.join(__dirname, 'hls-temp');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const playlist = path.join(outputDir, 'playlist.m3u8');

    // Limpiar playlist previa
    if (fs.existsSync(playlist)) fs.unlinkSync(playlist);

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
        .on('end', () => {
            console.log('HLS generado:', playlist);
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
