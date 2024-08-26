const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const figlet = require('figlet');
const asciify = require('asciify-image');
const bcrypt = require('bcrypt');
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '10mb' }));

const credentials = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'farmacia'
};

app.get('/', (req, res) => {
    res.send('Servidor');
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const values = [username];
    var connection = mysql.createConnection(credentials);

    const query = `
        SELECT 
            u.id, 
            u.username, 
            u.user, 
            u.password, 
            r.descripcion AS rol 
        FROM 
            usuarios u 
        JOIN 
            rol r ON u.rol = r.id 
        WHERE 
            u.username = ?
    `;

    connection.query(query, values, (err, result) => {
        if (err) {
            res.status(500).send(err);
            connection.end();
            return;
        }

        if (result.length > 0) {
            const user = result[0];

            // Comparar la contraseña proporcionada con el hash almacenado
            bcrypt.compare(password, user.password, (compareErr, isMatch) => {
                if (compareErr) {
                    res.status(500).send(compareErr);
                    connection.end();
                    return;
                }

                if (isMatch) {
                    res.status(200).send({
                        "id": user.id,
                        "user": user.user,
                        "username": user.username,
                        "picture": user.picture,
                        "rol": user.rol, // Mostrar la descripción del rol
                        "isAuth": true
                    });
                } else {
                    res.status(400).send('Credenciales incorrectas');
                }

                connection.end();
            });
        } else {
            res.status(400).send('Usuario no existe');
            connection.end();
        }
    });
});

/*app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const values = [username];
    const connection = mysql.createConnection(credentials);

    const query = `
        SELECT 
            u.id, 
            u.username, 
            u.user, 
            u.password, 
            r.descripcion AS rol 
        FROM 
            usuarios u 
        JOIN 
            rol r ON u.rol = r.id 
        WHERE 
            u.username = ?
    `;

    connection.query(query, values, (err, result) => {
        if (err) {
            res.status(500).send(err);
            connection.end();
            return;
        }

        if (result.length > 0) {
            const user = result[0];

            // Comparar la contraseña proporcionada con la contraseña almacenada en texto plano
            if (password === user.password) {
                res.status(200).send({
                    "id": user.id,
                    "user": user.user,
                    "username": user.username,
                    "rol": user.rol,
                    "isAuth": true
                });
            } else {
                res.status(400).send('Credenciales incorrectas');
            }

            connection.end();
        } else {
            res.status(400).send('Usuario no existe');
            connection.end();
        }
    });
});*/


app.get('/api/usuarios', (req, res) => {
    var connection = mysql.createConnection(credentials);
    const query = `
        SELECT 
    u.id, 
    u.username, 
    u.user,
    u.password,  
    u.correo, 
    u.carnet,
    u.rol,
    r.descripcion AS descripcion, 
    u.dpi, 
    u.telefono, 
    u.direccion,
    u.estado
            FROM 
                usuarios u 
            JOIN 
                rol r ON u.rol = r.id;

    `;
    connection.query(query, (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
        connection.end();
    });
});


app.post('/api/eliminar', (req, res) => {
    const { id } = req.body;
    var connection = mysql.createConnection(credentials);
    connection.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Usuario Eliminado" });
        }
    });
    connection.end();
});

app.post('/api/guardar', (req, res) => {
    const { id, username, user, password, correo, carnet, rol, dpi, telefono, direccion, estado } = req.body;

    // Define saltRounds
    const saltRounds = 10;

    // Encriptar la contraseña antes de almacenarla
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            res.status(500).send(err);
            return;
        }

        const hashedPassword = hash;

        const params = [[id, username, user, hashedPassword, correo, carnet, rol, dpi, telefono, direccion, estado]];
        var connection = mysql.createConnection(credentials);

        connection.query('INSERT INTO usuarios (id, username, user, password, correo, carnet, rol, dpi, telefono, direccion, estado) VALUES ?', [params], (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({ "status": "success", "message": "Usuario creado" });
            }
        });

        connection.end();
    });
});

/*app.post('/api/editar', (req, res) => {
    const { id, username, user, password, correo, carnet, rol, dpi, telefono, direccion, estado } = req.body;
    const connection = mysql.createConnection(credentials);

    // Si se proporciona una nueva contraseña, encriptarla
    if (password) {
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                res.status(500).send({ error: 'Error al encriptar la contraseña' });
                connection.end();
                return;
            }

            // Actualizar usuario con nueva contraseña encriptada
            const params = [username, user, hashedPassword, correo, carnet, rol, dpi, telefono, direccion, estado, id];
            const query = `
                UPDATE usuarios 
                SET 
                    username = ?, 
                    user = ?, 
                    password = ?, 
                    correo = ?, 
                    carnet = ?, 
                    rol = ?, 
                    dpi = ?, 
                    telefono = ?, 
                    direccion = ?, 
                    estado = ? 
                WHERE id = ?
            `;

            connection.query(query, params, (err, result) => {
                if (err) {
                    res.status(500).send({ error: 'Error al actualizar el usuario' });
                } else {
                    res.status(200).send({ status: "success", message: "Usuario editado" });
                }
                connection.end();
            });
        });
    } else {
        // Si no se proporciona una nueva contraseña, no actualizar el campo password
        const params = [username, user, correo, carnet, rol, dpi, telefono, direccion, estado, id];
        const query = `
            UPDATE usuarios 
            SET 
                username = ?, 
                user = ?, 
                correo = ?, 
                carnet = ?, 
                rol = ?, 
                dpi = ?, 
                telefono = ?, 
                direccion = ?, 
                estado = ? 
            WHERE id = ?
        `;

        connection.query(query, params, (err, result) => {
            if (err) {
                res.status(500).send({ error: 'Error al actualizar el usuario' });
            } else {
                res.status(200).send({ status: "success", message: "Usuario editado" });
            }
            connection.end();
        });
    }
});*/

app.post('/api/editar', (req, res) => {
    const { id, username, user, password, correo, carnet, rol, dpi, telefono, direccion, estado } = req.body;
    const connection = mysql.createConnection(credentials);

    // Definir la consulta SQL y los parámetros de actualización
    let query;
    let params;

    if (password && password.trim() !== '') {
        // Si se proporciona una nueva contraseña no vacía, encriptarla
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                res.status(500).send({ error: 'Error al encriptar la contraseña' });
                connection.end();
                return;
            }

            // Actualizar usuario con nueva contraseña encriptada
            query = `
                UPDATE usuarios 
                SET 
                    username = ?, 
                    user = ?, 
                    password = ?, 
                    correo = ?, 
                    carnet = ?, 
                    rol = ?, 
                    dpi = ?, 
                    telefono = ?, 
                    direccion = ?, 
                    estado = ? 
                WHERE id = ?
            `;
            params = [username, user, hashedPassword, correo, carnet, rol, dpi, telefono, direccion, estado, id];

            connection.query(query, params, (err, result) => {
                if (err) {
                    res.status(500).send({ error: 'Error al actualizar el usuario' });
                } else {
                    res.status(200).send({ status: "success", message: "Usuario editado" });
                }
                connection.end();
            });
        });
    } else {
        // Si no se proporciona una nueva contraseña, no actualizar el campo password
        query = `
            UPDATE usuarios 
            SET 
                username = ?, 
                user = ?, 
                correo = ?, 
                carnet = ?, 
                rol = ?, 
                dpi = ?, 
                telefono = ?, 
                direccion = ?, 
                estado = ? 
            WHERE id = ?
        `;
        params = [username, user, correo, carnet, rol, dpi, telefono, direccion, estado, id];

        connection.query(query, params, (err, result) => {
            if (err) {
                res.status(500).send({ error: 'Error al actualizar el usuario' });
            } else {
                res.status(200).send({ status: "success", message: "Usuario editado" });
            }
            connection.end();
        });
    }
});


app.get('/api/roles', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT id, descripcion FROM rol', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});
//////////////////////////////////Rol//////////////////////////////////////////

app.get('/api/rol_select', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT * FROM rol', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});


app.listen(4000, async () => {
    const ascified = await asciify('helmet.png', { fit: 'box', width: 10, height: 10 });
    console.log(ascified);
    console.log(figlet.textSync('Server v. 1.0.0'));
});
