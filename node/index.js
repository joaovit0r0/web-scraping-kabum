import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import { open } from 'sqlite';
import { sendEmail } from './emailService.js';

const PORT = 3030;
const HOST = '0.0.0.0';

const app = express();

app.use(cors())
app.use(express.json());

(async () => {
    try {
        const db = await open({
            filename: 'database.sqlite',
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS gpus (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL,
                model TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        app.get('/', async (req, res) => {
            try {
                const gpus = await db.all('SELECT * FROM gpus');

                let filteredData = {};

                gpus.forEach(gpu => {
                    if (!filteredData[gpu.model]) {
                        filteredData[gpu.model] = {
                            'quantity': 0,
                            'totalCost': 0
                        };
                    }

                    filteredData[gpu.model].quantity++;
                    filteredData[gpu.model].totalCost += gpu.price;
                });

                const data = Object.entries(filteredData).map(gpu => {
                    return {
                        'avgPrice': Math.round(gpu[1].totalCost / gpu[1].quantity),
                        'model': gpu[0]
                    }
                });

                res.status(200).json(data);
            } catch (error) {
                console.error('Erro ao manipular dados do usuário:', error);
                res.status(500).json({ error: 'Erro ao acessar o banco de dados' });
            }
        });

        app.post('/save/products', async (req, res) => {
            try {
                await db.exec('BEGIN TRANSACTION');

                const stmt = await db.prepare('INSERT INTO gpus (model, name, price) VALUES (?, ?, ?)');

                for (const product of req.body) {
                    await stmt.run(product.model, product.name, product.price);
                }

                await stmt.finalize();
                await db.exec('COMMIT');

                res.status(200).json({ msg: 'show' });
            } catch (error) {
                await db.exec('ROLLBACK');
                console.error('Erro ao realizar multi-insert:', error.message);
                res.status(500).json({ error: 'Erro ao inserir os produtos' });
            }
        });

        app.post('/notify', async (req, res) => {
            const { to } = req.body;
            
            sendEmail(to,
                 'Boas vindas!', 
                 `Seja bem vindo a Newsletter de preços da Kabum!
                  A partir de agora você receberá atualizações diárias dos preços das RTX 40.
                 `
                );
            res.send('Email enviado com sucesso');
        })

        app.listen(PORT, HOST, () => {
            console.log(`Servidor rodando em http://${HOST}:${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados SQLite:', error);
        process.exit(1);
    }
})();
