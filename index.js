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
    const { id, nombre, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, laboratorio_id, fecha_vencimiento } = req.body;
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
    const { proveedorId, total_compra, farmacos, Nofactura } = req.body;  // Recibe un array de fármacos y detalles de compra

    const compraParams = [proveedorId, total_compra, Nofactura ];

    console.log('Proveedor ID:', proveedorId);
    console.log('Total Compra:', total_compra);
    console.log('Factura:', Nofactura);
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
        connection.query('INSERT INTO compras (proveedor_id, total_compra, Nofactura) VALUES (?, ?, ?)', compraParams, (err, result) => {
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


  







app.listen(4000, async () => {
    const ascified = await asciify('helmet.png', { fit: 'box', width: 10, height: 10 });
    console.log(ascified);
    console.log(figlet.textSync('Server v. 1.0.0'));
});
 