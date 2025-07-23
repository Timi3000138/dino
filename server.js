const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DATEI = './highscore.json';

app.use(cors());
app.use(express.json());

app.get('/highscore', (req, res) => {
    console.log('Highscore wurde angefragt.');
    fs.readFile(DB_DATEI, (err, daten) => {
        if (err) {
            return res.json({ name: 'Niemand', score: 0 });
        }
        res.json(JSON.parse(daten));
    });
});

app.post('/highscore', (req, res) => {
    const neuerHighscore = req.body;
    console.log('Neuer Highscore empfangen:', neuerHighscore);
    fs.readFile(DB_DATEI, (err, daten) => {
        let aktuellerHighscore = { score: 0 };
        if (!err) {
            aktuellerHighscore = JSON.parse(daten);
        }
        if (neuerHighscore.score > aktuellerHighscore.score) {
            console.log('Neuer Rekord! Wird gespeichert...');
            fs.writeFile(DB_DATEI, JSON.stringify(neuerHighscore), (err) => {
                if (err) {
                    return res.status(500).json({ nachricht: 'Fehler beim Speichern' });
                }
                res.json({ nachricht: 'Neuer Highscore gespeichert!' });
            });
        } else {
            res.json({ nachricht: 'Score war nicht höher.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Dino Game Server läuft auf Port ${PORT}`);
});