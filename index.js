const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');
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


/*app.post('/api/login', (req, res) => {
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
});*/

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
            u.estado,  
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

            // Verificar si el usuario está activo
            if (user.estado !== 'Activo') {
                res.status(403).send('Usuario inactivo, no puede iniciar sesión');
                connection.end();
                return;
            }

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

//////////////////////////////////Rol//////////////////////////////////////////
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

app.post('/api/eliminar_rol', (req, res) => {
    const { id } = req.body;
    var connection = mysql.createConnection(credentials);
    connection.query('DELETE FROM rol WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Rol Eliminado" });
        }
    });
    connection.end();
});

app.post('/api/guardar_rol', (req, res) => {
    const { id, descripcion } = req.body;
    const params = [[id, descripcion]];
    var connection = mysql.createConnection(credentials);
    connection.query('INSERT INTO rol (id, descripcion ) VALUES ?', [params], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "rol creada" });
        }
    });
    connection.end();
});

app.post('/api/editar_rol', (req, res) => {
    const { id, descripcion} = req.body;
    const params = [descripcion, id];
    var connection = mysql.createConnection(credentials);
    connection.query('UPDATE rol SET descripcion = ? WHERE id = ?', params, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "rol editada" });
        }
    });
    connection.end();
});

////////////////////////////////LABORATORIO//////////////////////////////////////

app.get('/api/laboratorio', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT * FROM laboratorios', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.post('/api/eliminar_lab', (req, res) => {
    const { id } = req.body;
    var connection = mysql.createConnection(credentials);
    connection.query('DELETE FROM laboratorios WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Laboratorio Eliminado" });
        }
    });
    connection.end();
});

app.post('/api/guardar_lab', (req, res) => {
    const { id, nombre, direccion, telefono, correo_electronico } = req.body;
    const params = [[id, nombre, direccion, telefono, correo_electronico ]];
    var connection = mysql.createConnection(credentials);
    connection.query('INSERT INTO laboratorios (id, nombre, direccion, telefono, correo_electronico ) VALUES ?', [params], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Laboratorio creada" });
        }
    });
    connection.end();
});

app.post('/api/editar_lab', (req, res) => {
    const { id, nombre, direccion, telefono, correo_electronico} = req.body;
    const params = [nombre, direccion, telefono, correo_electronico, id];
    var connection = mysql.createConnection(credentials);
    connection.query('UPDATE laboratorios SET nombre = ?, direccion = ?, telefono = ?, correo_electronico = ? WHERE id = ?', params, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Laboratorio editada" });
        }
    });
    connection.end();
});

/////////////////////////////////////////PROVEEDOR///////////////////////////////////
app.get('/api/proveedor', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT * FROM proveedores', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.post('/api/eliminar_prov', (req, res) => {
    const { id } = req.body;
    var connection = mysql.createConnection(credentials);
    connection.query('DELETE FROM proveedores WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Proveedor Eliminado" });
        }
    });
    connection.end();
});

app.post('/api/guardar_prov', (req, res) => {
    const { id, nombre, direccion, telefono, correo_electronico } = req.body;
    const params = [[id, nombre, direccion, telefono, correo_electronico ]];
    var connection = mysql.createConnection(credentials);
    connection.query('INSERT INTO proveedores (id, nombre, direccion, telefono, correo_electronico ) VALUES ?', [params], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Proveedor creada" });
        }
    });
    connection.end();
});

app.post('/api/editar_prov', (req, res) => {
    const { id, nombre, direccion, telefono, correo_electronico} = req.body;
    const params = [nombre, direccion, telefono, correo_electronico, id];
    var connection = mysql.createConnection(credentials);
    connection.query('UPDATE proveedores SET nombre = ?, direccion = ?, telefono = ?, correo_electronico = ? WHERE id = ?', params, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Proveedor editada" });
        }
    });
    connection.end();
});

/////////////////////////////////////////FARMACO//////////////////////////////////////

app.get('/api/farmacos', (req, res) => {
    var connection = mysql.createConnection(credentials);
    const query = `
       SELECT 
       f.id, 
       f.nombre, 
       f.descripcion, 
       f.precio_caja, 
       f.precio_blister, 
       f.precio_unidad, 
       f.precio_venta_caja, 
       f.precio_venta_blister, 
       f.precio_venta_unidad, 
       f.blisters_por_caja, 
       f.unidades_por_blister, 
       f.stock_caja, 
       f.stock_blister, 
       f.stock_unidad, 
       f.nivel_reorden,
       f.codigo_barras,
       f.proveedor_id,
       f.laboratorio_id,
       p.nombre AS proveedor, 
       l.nombre AS laboratorio, 
       f.fecha_creacion, 
       f.ultima_actualizacion, 
       f.stock_total_calculado, 
       f.fecha_vencimiento 
       FROM farmacos f 
       INNER JOIN proveedores 
       p ON f.proveedor_id = p.id 
       INNER JOIN 
       laboratorios l ON f.laboratorio_id = l.id 

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

app.get('/api/lab_select', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT id, nombre FROM laboratorios', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.get('/api/prov_select', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT id, nombre FROM proveedores', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.post('/api/guardar_farmaco', (req, res) => {
    const { id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento  } = req.body;
    const params = [[id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento  ]];
    var connection = mysql.createConnection(credentials);
    connection.query('INSERT INTO farmacos (id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento  ) VALUES ?', [params], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "farmaco creada" });
        }
    });
    connection.end();
});

app.post('/api/editar_farmaco', (req, res) => {
    const { id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento, presentationType } = req.body;
    const params = [nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento, id];
    var connection = mysql.createConnection(credentials);
    connection.query('UPDATE farmacos SET nombre = ?, descripcion = ?, precio_caja = ?, precio_blister = ?, precio_unidad = ?, precio_venta_caja = ?, precio_venta_blister = ?, precio_venta_unidad = ?, blisters_por_caja = ?, unidades_por_blister = ?, stock_caja = ?, stock_blister = ?, stock_unidad = ?, nivel_reorden = ?, codigo_barras = ?, proveedor_id = ?, laboratorio_id = ?, fecha_vencimiento = ?  WHERE id = ?', params, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Farmaco editada" });
        }
    });
    connection.end();
});

/*app.post('/api/editar_farmaco', (req, res) => {
    const { id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento, presentationType, cantidad } = req.body;

    var connection = mysql.createConnection(credentials);
    
    // Variables para la consulta SQL y los parámetros
    let query = 'UPDATE farmacos SET ';
    let params = [];

    // Agregar campos comunes que se actualizarán en todos los casos
    let commonFields = 'nombre = ?, descripcion = ?, nivel_reorden = ?, codigo_barras = ?, proveedor_id = ?, laboratorio_id = ?, fecha_vencimiento = ?';
    params.push(nombre, descripcion, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento);

    // Ajustar la lógica según el tipo de presentación
    if (presentationType === 'caja') {
        // Actualización si se vende una caja
        query += `${commonFields}, stock_caja = GREATEST(stock_caja - ?, 0), stock_blister = GREATEST(FLOOR((stock_caja - ?) * ?), 0), stock_unidad = GREATEST(FLOOR((stock_blister) * ?), 0) WHERE id = ?`;
        params.push(cantidad, cantidad, blisters_por_caja, unidades_por_blister, id);

    } else if (presentationType === 'blister') {
        // Actualización si se vende un blíster
        query += `${commonFields}, stock_blister = GREATEST(stock_blister - ?, 0), stock_unidad = GREATEST(FLOOR((stock_blister) * ?), 0), stock_caja = GREATEST(FLOOR(stock_blister / ?), 0) WHERE id = ?`;
        params.push(cantidad, unidades_por_blister, blisters_por_caja, id);

    } else if (presentationType === 'unidad') {
        // Actualización si se venden unidades
        query += `${commonFields}, stock_unidad = GREATEST(stock_unidad - ?, 0), stock_blister = GREATEST(FLOOR(stock_unidad / ?), 0), stock_caja = GREATEST(FLOOR(stock_blister / ?), 0) WHERE id = ?`;
        params.push(cantidad, unidades_por_blister, blisters_por_caja, id);

    } else {
        res.status(400).send({ "status": "error", "message": "Tipo de presentación no válido" });
        return;
    }

    // Ejecutar la consulta
    connection.query(query, params, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Fármaco editado correctamente" });
        }
    });

    connection.end();
});*/


app.post('/api/eliminar_farmaco', (req, res) => {
    const { id } = req.body;
    var connection = mysql.createConnection(credentials);
    connection.query('DELETE FROM farmacos WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Farmaco Eliminado" });
        }
    });
    connection.end();
});

//////////////////////////Tipo Documento///////////////////////////////////////////
app.get('/api/tipo_documento', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT id, nombre_documento FROM tipo_documento', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.get('/api/documento_select', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT * FROM tipo_documento', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.post('/api/eliminar_documento', (req, res) => {
    const { id } = req.body;
    var connection = mysql.createConnection(credentials);
    connection.query('DELETE FROM tipo_documento WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Documento Eliminado" });
        }
    });
    connection.end();
});

app.post('/api/guardar_documento', (req, res) => {
    const { id, descripcion } = req.body;
    const params = [[id, descripcion]];
    var connection = mysql.createConnection(credentials);
    connection.query('INSERT INTO tipo_documento (id, nombre_documento ) VALUES ?', [params], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Documento creada" });
        }
    });
    connection.end();
});

app.post('/api/editar_documento', (req, res) => {
    const { id, descripcion} = req.body;
    const params = [descripcion, id];
    var connection = mysql.createConnection(credentials);
    connection.query('UPDATE tipo_documento SET nombre_documento = ? WHERE id = ?', params, (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ "status": "success", "message": "Documento editada" });
        }
    });
    connection.end();
});


/////////////////////////////////Compras//////////////////////////////////////////

/*app.post('/api/guardar_farmaco_compra', (req, res) => {
    const { proveedorId, total_compra, farmacos } = req.body;  // Recibe un array de fármacos y detalles de compra

    const compraParams = [proveedorId, total_compra]; 

    console.log('Proveedor ID:', proveedorId);
    console.log('Total Compra:', total_compra);
    console.log('Fármacos:', farmacos); 

    const connection = mysql.createConnection(credentials);

    connection.beginTransaction((err) => {   
        if (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al iniciar transacción',
                error: err.message
            });
        }

        // Inserción en la tabla compras
        connection.query('INSERT INTO compras (proveedor_id, total_compra) VALUES (?, ?)', compraParams, (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    connection.end();  // Asegúrate de cerrar la conexión
                    res.status(500).send({
                        status: 'error',
                        message: 'Error al insertar compra',
                        error: err.message
                    });
                });
            }

            const compra_id = result.insertId;  // Obtener el ID de la compra recién creada

            // Promesas individuales para cada inserción de fármacos
            const insertFarmaco = (farmaco) => {
                return new Promise((resolve, reject) => {
                    const farmacoParams = [
                        farmaco.id,
                        farmaco.nombre,
                        farmaco.descripcion,
                        farmaco.precio_caja,
                        farmaco.precio_blister,
                        farmaco.precio_unidad,
                        farmaco.precio_venta_caja,
                        farmaco.precio_venta_blister,
                        farmaco.precio_venta_unidad,
                        farmaco.blisters_por_caja,
                        farmaco.unidades_por_blister,
                        farmaco.stock_caja,
                        farmaco.stock_blister,
                        farmaco.stock_unidad,
                        farmaco.nivel_reorden,
                        farmaco.codigo_barras,
                        farmaco.proveedor_id,  // Usar proveedorId aquí
                        farmaco.laboratorio_id,
                        farmaco.fecha_vencimiento  
                    ];

                    connection.query('INSERT INTO farmacos (id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', farmacoParams, (err) => {
                        if (err) {
                            return reject(new Error('Error al insertar fármaco: ' + err.message));
                        }
                        resolve();
                    });
                });
            };

            // Ejecutar las inserciones de los fármacos de forma secuencial
            const insertAllFarmacos = async () => {
                for (const farmaco of farmacos) {
                    try {
                        await insertFarmaco(farmaco);
                    } catch (error) {
                        return Promise.reject(error);
                    }
                }
                return Promise.resolve();
            };

            // Intentar insertar todos los fármacos y finalizar la transacción
            insertAllFarmacos()
                .then(() => {
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.end();  // Asegúrate de cerrar la conexión
                                res.status(500).send({
                                    status: 'error',
                                    message: 'Error al confirmar transacción',
                                    error: err.message
                                });
                            });
                        }
                        connection.end();  // Asegúrate de cerrar la conexión
                        res.status(200).send({
                            status: 'success',
                            message: 'Fármacos y compra registrados correctamente'
                        });
                    });
                })
                .catch((error) => {
                    connection.rollback(() => {
                        connection.end();  // Asegúrate de cerrar la conexión
                        res.status(500).send({
                            status: 'error',
                            message: error.message
                        });
                    });
                });
        });
    });
});*/

app.post('/api/guardar_farmaco_compra', (req, res) => {
    const { proveedorId, total_compra, farmacos, Nofactura, documentoId} = req.body;  // Recibe un array de fármacos y detalles de compra

    const compraParams = [proveedorId, total_compra, Nofactura, documentoId];

    console.log('Proveedor ID:', proveedorId);
    console.log('Total Compra:', total_compra);
    console.log('Factura:', Nofactura);
    console.log('Documento:', documentoId);
    console.log('Fármacos:', farmacos);
   

    const connection = mysql.createConnection(credentials);

    connection.beginTransaction((err) => {
        if (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al iniciar transacción',
                error: err.message
            });
        }

        // Inserción en la tabla compras
        connection.query('INSERT INTO compras (proveedor_id, total_compra, Nofactura, tipo_documento_id) VALUES (?, ?, ?, ?)', compraParams, (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    connection.end();  // Asegúrate de cerrar la conexión
                    res.status(500).send({
                        status: 'error',
                        message: 'Error al insertar compra',
                        error: err.message
                    });
                });
            }

            const compra_id = result.insertId;  // Obtener el ID de la compra recién creada

            // Promesas individuales para cada inserción o actualización de fármacos
            const upsertFarmaco = (farmaco) => {
                return new Promise((resolve, reject) => {
                    const farmacoParams = [
                        farmaco.nombre,
                        farmaco.descripcion,
                        farmaco.precio_caja,
                        farmaco.precio_blister,
                        farmaco.precio_unidad,
                        farmaco.precio_venta_caja,
                        farmaco.precio_venta_blister,
                        farmaco.precio_venta_unidad,
                        farmaco.blisters_por_caja,
                        farmaco.unidades_por_blister,
                        farmaco.stock_caja,
                        farmaco.stock_blister,
                        farmaco.stock_unidad,
                        farmaco.nivel_reorden,
                        farmaco.codigo_barras,
                        farmaco.proveedor_id,
                        farmaco.laboratorio_id,
                        farmaco.fecha_vencimiento,
                        farmaco.id
                    ];

                    // Verificar si el fármaco ya existe
                    connection.query('SELECT id FROM farmacos WHERE id = ?', [farmaco.id], (err, rows) => {
                        if (err) {
                            return reject(new Error('Error al verificar fármaco: ' + err.message));
                        }

                        if (rows.length > 0) {
                            // Si el fármaco ya existe, actualizamos los datos
                            connection.query(
                                `UPDATE farmacos 
                                    SET 
                                        nombre = ?, 
                                        descripcion = ?, 
                                        precio_caja = ?, 
                                        precio_blister = ?, 
                                        precio_unidad = ?, 
                                        precio_venta_caja = ?, 
                                        precio_venta_blister = ?, 
                                        precio_venta_unidad = ?, 
                                        blisters_por_caja = ?, 
                                        unidades_por_blister = ?, 
                                        stock_caja = stock_caja + ?, 
                                        stock_blister = stock_blister + ?, 
                                        stock_unidad = stock_unidad + ?, 
                                        nivel_reorden = ?, 
                                        codigo_barras = ?, 
                                        proveedor_id = ?, 
                                        laboratorio_id = ?, 
                                        fecha_vencimiento = ?
                                    WHERE id = ?
                                    `, 
                                farmacoParams, (err) => {
                                    if (err) {
                                        return reject(new Error('Error al actualizar fármaco: ' + err.message));
                                    }
                                    resolve();
                                }
                            );
                        } else {
                            // Si el fármaco no existe, lo insertamos
                            connection.query(
                                `INSERT INTO farmacos 
                                (id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, 
                                 precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, 
                                 stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, 
                                 laboratorio_id, fecha_vencimiento) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    farmaco.id,
                                    farmaco.nombre,
                                    farmaco.descripcion,
                                    farmaco.precio_caja,
                                    farmaco.precio_blister,
                                    farmaco.precio_unidad,
                                    farmaco.precio_venta_caja,
                                    farmaco.precio_venta_blister,
                                    farmaco.precio_venta_unidad,
                                    farmaco.blisters_por_caja,
                                    farmaco.unidades_por_blister,
                                    farmaco.stock_caja,
                                    farmaco.stock_blister,
                                    farmaco.stock_unidad,
                                    farmaco.nivel_reorden,
                                    farmaco.codigo_barras,
                                    proveedorId,
                                    farmaco.laboratorio_id,
                                    farmaco.fecha_vencimiento
                                ], (err) => {
                                    if (err) {
                                        return reject(new Error('Error al insertar fármaco: ' + err.message));
                                    }
                                    resolve();
                                }
                            );
                        }
                    });
                });
            };

            // Ejecutar las inserciones/actualizaciones de los fármacos de forma secuencial
            const upsertAllFarmacos = async () => {
                for (const farmaco of farmacos) {
                    try {
                        await upsertFarmaco(farmaco);
                    } catch (error) {
                        return Promise.reject(error);
                    }
                }
                return Promise.resolve();
            };

            // Intentar insertar o actualizar todos los fármacos y finalizar la transacción
            upsertAllFarmacos()
                .then(() => {
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.end();  // Asegúrate de cerrar la conexión
                                res.status(500).send({
                                    status: 'error',
                                    message: 'Error al confirmar transacción',
                                    error: err.message
                                });
                            });
                        }
                        connection.end();  // Asegúrate de cerrar la conexión
                        res.status(200).send({
                            status: 'success',
                            message: 'Fármacos y compra registrados correctamente'
                        });
                    });
                })
                .catch((error) => {
                    connection.rollback(() => {
                        connection.end();  // Asegúrate de cerrar la conexión
                        res.status(500).send({
                            status: 'error',
                            message: error.message
                        });
                    });
                });
        });
    });
});

app.get('/api/farmaco/:id', (req, res) => {
    const { id } = req.params;
    const connection = mysql.createConnection(credentials);
  
    const query = `
      SELECT 
        f.id, 
        f.nombre, 
        f.descripcion, 
        f.precio_caja, 
        f.precio_blister, 
        f.precio_unidad, 
        f.precio_venta_caja, 
        f.precio_venta_blister, 
        f.precio_venta_unidad, 
        f.blisters_por_caja, 
        f.unidades_por_blister, 
        f.stock_caja, 
        f.stock_blister, 
        f.stock_unidad, 
        f.nivel_reorden,
        f.codigo_barras,
        f.proveedor_id,
        f.laboratorio_id,
        p.nombre AS proveedor, 
        l.nombre AS laboratorio, 
        f.fecha_creacion, 
        f.ultima_actualizacion, 
        f.stock_total_calculado, 
        f.fecha_vencimiento 
      FROM farmacos f 
      INNER JOIN proveedores p ON f.proveedor_id = p.id 
      INNER JOIN laboratorios l ON f.laboratorio_id = l.id 
      WHERE f.id = ?
    `;
  
    connection.query(query, [id], (err, rows) => {
      if (err) {
        res.status(500).send(err);
      } else if (rows.length === 0) {
        res.status(404).send('Fármaco no encontrado');
      } else {
        res.status(200).send(rows[0]);
      }
      connection.end();
    });
  });

////////////////////////////////Ventas/////////////////////////////////////////////////

app.get('/api/farmaco_venta/:id', (req, res) => {
    const { id } = req.params;
    const { tipo_presentacion } = req.query;

    console.log('ID:', id);
    console.log('TP:', tipo_presentacion);
  
    const connection = mysql.createConnection(credentials);
  
    // Define the SQL query with placeholders
    const query = `
      SELECT 
        f.id, 
        f.nombre, 
        f.descripcion, 
        f.precio_caja, 
        f.precio_blister, 
        f.precio_unidad, 
        f.precio_venta_caja, 
        f.precio_venta_blister, 
        f.precio_venta_unidad, 
        f.blisters_por_caja, 
        f.unidades_por_blister, 
        f.stock_caja, 
        f.stock_blister, 
        f.stock_unidad, 
        f.nivel_reorden,
        f.codigo_barras,
        f.proveedor_id,
        f.laboratorio_id,
        p.nombre AS proveedor, 
        l.nombre AS laboratorio, 
        f.fecha_creacion, 
        f.ultima_actualizacion, 
        f.stock_total_calculado, 
        f.fecha_vencimiento 
      FROM farmacos f 
      INNER JOIN proveedores p ON f.proveedor_id = p.id 
      INNER JOIN laboratorios l ON f.laboratorio_id = l.id 
      WHERE f.id = ?
    `;
  
    connection.query(query, [id], (err, rows) => {
      if (err) {
        console.error('Database query error:', err); // Log the error
        return res.status(500).send('Error al consultar la base de datos');
      }
  
      if (rows.length === 0) {
        return res.status(404).send('Fármaco no encontrado');
      }
  
      const farmaco = rows[0];
      let precioVenta = 0;
      let nombrePresentacion = '';
  
      switch (tipo_presentacion) {
        case 'caja':
          precioVenta = farmaco.precio_venta_caja;
          nombrePresentacion = 'Caja';
          break;
        case 'blister':
          precioVenta = farmaco.precio_venta_blister;
          nombrePresentacion = 'Blister';
          break;
        case 'unidad':
          precioVenta = farmaco.precio_venta_unidad;
          nombrePresentacion = 'Unidad';
          break;
        default:
          return res.status(400).send('Tipo de presentación inválido');
      }
  
      res.status(200).send({
        nombre: farmaco.nombre,
        precio_venta: precioVenta,
      });
  
      connection.end();
    });
  });

  app.post('/api/guardar_farmaco_venta', (req, res) => {
    const { total_venta, farmacos, Nofactura } = req.body;

    // Verificación de parámetros
    if (!total_venta || !farmacos || !Nofactura) {
        return res.status(400).send({ status: 'error', message: 'Faltan datos en la solicitud' });
    }

    const ventaParams = [total_venta, Nofactura];
    const connection = mysql.createConnection(credentials);

    connection.beginTransaction((err) => {
        if (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al iniciar transacción',
                error: err.message
            });
        }

        // Inserción en la tabla ventas
        connection.query('INSERT INTO ventas (total_venta, Nofactura) VALUES (?, ?)', ventaParams, (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    connection.end();
                    res.status(500).send({
                        status: 'error',
                        message: 'Error al insertar venta',
                        error: err.message
                    });
                });
            }

            const venta_id = result.insertId;

            // Función para actualizar el stock de un fármaco
            const updateFarmacoStock = (farmaco) => {
                return new Promise((resolve, reject) => {
                    const { id, cantidad, tipo_presentacion } = farmaco;

                    // Consultar stock actual y detalles de la presentación
                    connection.query('SELECT stock_unidad, stock_blister, stock_caja, blisters_por_caja, unidades_por_blister FROM farmacos WHERE id = ?', [id], (err, rows) => {
                        if (err) {
                            return reject(new Error('Error al verificar fármaco: ' + err.message));
                        }

                        if (rows.length > 0) {
                            const { stock_unidad, stock_blister, stock_caja, blisters_por_caja, unidades_por_blister } = rows[0];

                            // Lógica para presentación "unidad"
                            // Lógica para presentación "unidad"
                            if (tipo_presentacion === 'unidad') {
                                let unidades_a_disminuir = cantidad;
                                let nuevasUnidades = stock_unidad - unidades_a_disminuir;
                                let nuevosBlisters = stock_blister;
                                let nuevasCajas = stock_caja;

                                // Si las unidades no son suficientes, descontamos de los blisters
                                if (nuevasUnidades < 0) {
                                    // Cuántas unidades faltan
                                    let unidades_faltantes = Math.abs(nuevasUnidades);

                                    // Cuántos blisters necesitamos para cubrir esas unidades faltantes
                                    let blisters_necesarios = Math.ceil(unidades_faltantes / unidades_por_blister);
                                    
                                    // Restamos esos blisters del stock de blisters
                                    nuevosBlisters = nuevosBlisters - blisters_necesarios;

                                    // Calculamos el nuevo stock de unidades después de usar los blisters
                                    nuevasUnidades = (blisters_necesarios * unidades_por_blister) - unidades_faltantes;

                                    // Si no hay suficientes blisters, descontamos de las cajas
                                    if (nuevosBlisters < 0) {
                                        let blisters_faltantes = Math.abs(nuevosBlisters);
                                        let cajas_necesarias = Math.ceil(blisters_faltantes / blisters_por_caja);

                                        // Restamos esas cajas del stock de cajas
                                        nuevasCajas = stock_caja - cajas_necesarias;

                                        // Calculamos el nuevo stock de blisters después de usar las cajas
                                        nuevosBlisters = (cajas_necesarias * blisters_por_caja) - blisters_faltantes;
                                    }
                                }

                                // Aseguramos que los valores sean mayores o iguales a cero antes de actualizar
                                const updateQuery = `
                                    UPDATE farmacos
                                    SET stock_unidad = GREATEST(?, 0),
                                        stock_blister = GREATEST(?, 0),
                                        stock_caja = GREATEST(?, 0)
                                    WHERE id = ?`;

                                const updateParams = [nuevasUnidades, nuevosBlisters, nuevasCajas,  id];
                              
                                connection.query(updateQuery, updateParams, (err) => {
                                    if (err) {
                                        return reject(new Error('Error al actualizar el stock del fármaco: ' + err.message));
                                    }
                                    resolve();
                                });
                            }

                            
                            
                            
                            
                            
                            
                            // Lógica para presentación "blister"
                            else if (tipo_presentacion === 'blister') {
                                let blisters_a_disminuir = cantidad;
                                let nuevosBlisters = stock_blister - blisters_a_disminuir;
                                let nuevasUnidades = stock_unidad - (cantidad * unidades_por_blister);

                                const updateQuery = `
                                    UPDATE farmacos
                                    SET stock_blister = GREATEST(?, 0),
                                        stock_unidad = GREATEST(?, 0)
                                    WHERE id = ?`;
                                const updateParams = [nuevosBlisters, nuevasUnidades, id];

                                connection.query(updateQuery, updateParams, (err) => {
                                    if (err) {
                                        return reject(new Error('Error al actualizar el stock del fármaco: ' + err.message));
                                    }
                                    resolve();
                                });
                            }
                            // Lógica para presentación "caja"
                            else if (tipo_presentacion === 'caja') {
                                let nuevasCajas = stock_caja - cantidad;
                                let nuevosBlisters = stock_blister - (cantidad * blisters_por_caja);
                                let nuevasUnidades = stock_unidad - (cantidad * blisters_por_caja * unidades_por_blister);

                                const updateQuery = `
                                    UPDATE farmacos
                                    SET stock_caja = GREATEST(?, 0),
                                        stock_blister = GREATEST(?, 0),
                                        stock_unidad = GREATEST(?, 0)
                                    WHERE id = ?`;
                                const updateParams = [nuevasCajas, nuevosBlisters, nuevasUnidades, id];

                                connection.query(updateQuery, updateParams, (err) => {
                                    if (err) {
                                        return reject(new Error('Error al actualizar el stock del fármaco: ' + err.message));
                                    }
                                    resolve();
                                });
                            } else {
                                reject(new Error('Tipo de presentación no válido.'));
                            }
                        } else {
                            reject(new Error('El fármaco no existe en la base de datos.'));
                        }
                    });
                });
            };

            // Actualizar el stock para cada fármaco en el array
            const promises = farmacos.map(farmaco => updateFarmacoStock(farmaco));

            Promise.all(promises)
                .then(() => {
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                res.status(500).send({
                                    status: 'error',
                                    message: 'Error al confirmar transacción',
                                    error: err.message
                                });
                            });
                        }
                        res.status(200).send({
                            status: 'success',
                            message: 'Venta registrada y stock actualizado correctamente.',
                            venta_id
                        });
                    });
                })
                .catch((err) => {
                    connection.rollback(() => {
                        res.status(500).send({
                            status: 'error',
                            message: err.message
                        });
                    });
                });
        });
    });
});






app.listen(5000, () => {
    console.log('Server 5000');
});

 