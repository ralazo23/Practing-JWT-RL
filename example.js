const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const app = express();
const PORT = 3000;

// Configuración de la conexión a la base de datos MySQL
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'tokensbd'
});

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());

// Endpoint de login
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;

    // Consulta a la base de datos para verificar las credenciales del usuario
    pool.query('SELECT id FROM usuarios WHERE usuario = ? AND password = ?', [usuario, password], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar un token JWT con el userId en el payload y expiración de 1 minuto
        const token = jwt.sign({ userId: results[0].id }, 'mi secreto', { expiresIn: '1m' });
        res.json({ token });
    });
});

// Middleware para verificar el token JWT
function verificarToken(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }
    jwt.verify(token, 'mi secreto', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido, ha expirado" });
        }
        req.userId = decoded.userId;
        next();
    });
}

// Listar Cursos Asignados (privado)
app.get('/cursos', verificarToken, (req, res) => {
    const userId = req.userId;
    // Consulta a la base de datos para obtener los cursos asignados al usuario
    pool.query('SELECT * FROM asignacion_cursos WHERE id_usuario = ?', [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        res.json(results);
    });
});

// Mostrar Curso con mayor punteo (privado)
app.get('/curso/mayor-punteo', verificarToken, (req, res) => {
    const userId = req.userId;
    // Consulta a la base de datos para obtener el curso con el mayor puntaje asignado al usuario
    pool.query('SELECT * FROM asignacion_cursos WHERE id_usuario = ? ORDER BY nota DESC LIMIT 1', [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        res.json(results[0]);
    });
});

// Mostrar Curso con menor punteo (privado)
app.get('/curso/menor-punteo', verificarToken, (req, res) => {
    const userId = req.userId;
    // Consulta a la base de datos para obtener el curso con el menor puntaje asignado al usuario
    pool.query('SELECT * FROM asignacion_cursos WHERE id_usuario = ? ORDER BY nota ASC LIMIT 1', [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
