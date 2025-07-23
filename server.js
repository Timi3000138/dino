const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL-Werkzeug importieren

const app = express();
const PORT = process.env.PORT || 3000;

// Stellt die Verbindung zur Datenbank her, indem es den geheimen Link benutzt
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Diese Funktion erstellt die Highscore-Tabelle, falls sie noch nicht existiert
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS highscore (
                id INT PRIMARY KEY,
                name VARCHAR(15),
                score INT
            );
        `);
        // Fügt einen Starteintrag hinzu, falls die Tabelle leer ist
        const res = await client.query('SELECT COUNT(*) FROM highscore');
        if (res.rows[0].count === '0') {
            await client.query("INSERT INTO highscore (id, name, score) VALUES (1, 'Niemand', 0)");
        }
    } finally {
        client.release();
    }
};

app.use(cors());
app.use(express.json());

// GET-Endpunkt: Liest den Highscore aus der Datenbank
app.get('/highscore', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT name, score FROM highscore WHERE id = 1');
        res.json(result.rows[0] || { name: 'Niemand', score: 0 });
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).json({ nachricht: 'Fehler beim Lesen des Highscores' });
    }
});

// POST-Endpunkt: Speichert einen neuen Highscore in der Datenbank
app.post('/highscore', async (req, res) => {
    const { name, score } = req.body;
    try {
        const client = await pool.connect();
        // Aktualisiert den bestehenden Eintrag mit dem neuen Highscore
        await client.query('UPDATE highscore SET name = $1, score = $2 WHERE id = 1 AND $2 > score', [name, score]);
        res.json({ nachricht: 'Highscore eventuell aktualisiert!' });
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).json({ nachricht: 'Fehler beim Speichern des Highscores' });
    }
});

// Startet den Server und initialisiert die Datenbank
app.listen(PORT, () => {
    console.log(`Dino Game Server läuft auf Port ${PORT}`);
    initializeDatabase().catch(console.error);
});
