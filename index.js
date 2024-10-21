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
});*/

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const connection = mysql.createConnection(credentials);

    try {
        const query = `
            SELECT 
                u.id, 
                u.username, 
                u.user, 
                u.password, 
                u.estado,  
                r.descripcion AS rol,
                GROUP_CONCAT(p.nombre) AS permisos
            FROM 
                usuarios u 
            JOIN 
                rol r ON u.rol = r.id 
            LEFT JOIN 
                rol_permisos_modulos rpm ON rpm.rol_id = r.id 
            LEFT JOIN 
                permisos p ON rpm.permiso_id = p.id 
            WHERE 
                u.username = ?
            GROUP BY u.id;
        `;

        const values = [username];
        connection.query(query, values, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }

            if (result.length > 0) {
                const user = result[0];

                if (user.estado !== 'Activo') {
                    return res.status(403).send('Usuario inactivo, no puede iniciar sesión');
                }

                // Aquí deberías comparar la contraseña
                bcrypt.compare(password, user.password, (compareErr, isMatch) => {
                    if (compareErr) {
                        return res.status(500).send(compareErr);
                    }

                    if (isMatch) {
                        const permissions = user.permisos ? user.permisos.split(',') : []; // Si no hay permisos, será un array vacío

                        // Si no hay permisos, puedes manejarlo como desees
                        if (permissions.length === 0) {
                            console.warn(`Usuario ${username} no tiene permisos asignados.`);
                            // Puedes enviar un mensaje indicando que el usuario no tiene permisos
                            return res.status(403).send('El usuario no tiene permisos asignados');
                        }

                        return res.status(200).send({
                            "id": user.id,
                            "user": user.user,
                            "username": user.username,
                            "rol": user.rol,
                            "permissions": permissions,
                            "isAuth": true
                        });
                    } else {
                        return res.status(400).send('Credenciales incorrectas');
                    }
                });
            } else {
                return res.status(400).send('Usuario no existe');
            }
        });
    } catch (error) {
        console.error('Error en el servidor:', error);
        return res.status(500).send('Error en el servidor');
    } finally {
        connection.end();
    }
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

//////////////////Permisos//////////////////////////////////////////////////////
app.get('/api/permisos', (req, res) => {
    var connection = mysql.createConnection(credentials);
    
    const query = `
        SELECT
            r.id AS id, 
            r.descripcion AS rol,
            MAX(CASE WHEN p.id = '1' THEN 'Sí' ELSE 'No' END) AS ver_usuarios,
            MAX(CASE WHEN p.id = '2' THEN 'Sí' ELSE 'No' END) AS ver_ventas,
            MAX(CASE WHEN p.id = '3' THEN 'Sí' ELSE 'No' END) AS ver_compras,
            MAX(CASE WHEN p.id = '4' THEN 'Sí' ELSE 'No' END) AS ver_inventario,
            MAX(CASE WHEN p.id = '5' THEN 'Sí' ELSE 'No' END) AS ver_notificaciones,
            MAX(CASE WHEN p.id = '6' THEN 'Sí' ELSE 'No' END) AS view_home,
            MAX(CASE WHEN p.id = '7' THEN 'Sí' ELSE 'No' END) AS ver_rol,
            MAX(CASE WHEN p.id = '8' THEN 'Sí' ELSE 'No' END) AS ver_lab,
            MAX(CASE WHEN p.id = '9' THEN 'Sí' ELSE 'No' END) AS ver_prov,
            MAX(CASE WHEN p.id = '10' THEN 'Sí' ELSE 'No' END) AS ver_historial_compras,
            MAX(CASE WHEN p.id = '11' THEN 'Sí' ELSE 'No' END) AS ver_historial_ventas,
            MAX(CASE WHEN p.id = '12' THEN 'Sí' ELSE 'No' END) AS ver_tipod,
            MAX(CASE WHEN p.id = '13' THEN 'Sí' ELSE 'No' END) AS ver_permisos
        FROM 
            rol r
        LEFT JOIN 
            rol_permisos_modulos rpm ON rpm.rol_id = r.id
        LEFT JOIN 
            permisos p ON rpm.permiso_id = p.id
        GROUP BY 
            r.id;
    `;

    connection.query(query, (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    
    connection.end();
});


app.post('/api/guardar_permiso', (req, res) => {
    const { rolId, permisoId } = req.body; // ID del rol y del permiso a guardar

    const query = `
        INSERT INTO rol_permisos_modulos (rol_id, permiso_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE permiso_id = permiso_id; 
    `; // Asegura que no se dupliquen los permisos

    const connection = mysql.createConnection(credentials);
    
    connection.query(query, [rolId, permisoId], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ status: 'success', message: 'Permiso guardado correctamente' });
        }
    });

    connection.end();
});

// Endpoint para eliminar permiso
app.post('/api/eliminar_permiso', (req, res) => {
    const { rolId, permisoId } = req.body; // ID del rol y del permiso a eliminar

    const query = `
        DELETE FROM rol_permisos_modulos
        WHERE rol_id = ? AND permiso_id = ?;
    `;

    const connection = mysql.createConnection(credentials);
    
    connection.query(query, [rolId, permisoId], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({ status: 'success', message: 'Permiso eliminado correctamente' });
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
    CASE 
        WHEN f.precio_caja = 0 THEN '-' 
        ELSE f.precio_caja 
    END AS precio_caja,
    CASE 
        WHEN f.precio_blister = 0 THEN '-' 
        ELSE f.precio_blister 
    END AS precio_blister,
    CASE 
        WHEN f.precio_unidad = 0 THEN '-' 
        ELSE f.precio_unidad 
    END AS precio_unidad,
    CASE 
        WHEN f.precio_venta_caja = 0 THEN '-' 
        ELSE f.precio_venta_caja 
    END AS precio_venta_caja,
    CASE 
        WHEN f.precio_venta_blister = 0 THEN '-' 
        ELSE f.precio_venta_blister 
    END AS precio_venta_blister,
    CASE 
        WHEN f.precio_venta_unidad = 0 THEN '-' 
        ELSE f.precio_venta_unidad 
    END AS precio_venta_unidad,
    CASE 
        WHEN f.stock_caja = 0 THEN '-' 
        ELSE f.stock_caja 
    END AS stock_caja,
    CASE 
        WHEN f.stock_blister = 0 THEN '-' 
        ELSE f.stock_blister 
    END AS stock_blister,
    CASE 
        WHEN f.stock_unidad = 0 THEN '-' 
        ELSE f.stock_unidad 
    END AS stock_unidad,
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
    INNER JOIN laboratorios l ON f.laboratorio_id = l.id;


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

app.post('/api/guardar_farmaco_compra', (req, res) => {
    const { proveedorId, total_compra, farmacos, Nofactura, documentoId } = req.body;

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
                    connection.end();
                    res.status(500).send({
                        status: 'error',
                        message: 'Error al insertar compra',
                        error: err.message
                    });
                });
            }

            const compra_id = result.insertId;

            // Promesas individuales para cada inserción o actualización de fármacos
            const upsertFarmaco = (farmaco) => {
                return new Promise((resolve, reject) => {
                    const farmacoParams = [
                        farmaco.nombre,
                        farmaco.presentacion,
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
                            // Actualizamos los datos del fármaco existente
                            connection.query(
                                `UPDATE farmacos 
                                    SET 
                                        nombre = ?,
                                        presentacion = ?,
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
                                    WHERE id = ?`,
                                farmacoParams, (err) => {
                                    if (err) {
                                        return reject(new Error('Error al actualizar fármaco: ' + err.message));
                                    }
                                    resolve(farmaco.id); // Devuelve el id del fármaco actualizado
                                }
                            );
                        } else {
                            // Insertamos un nuevo fármaco
                            connection.query(
                                `INSERT INTO farmacos 
                                (id, nombre, presentacion, descripcion, precio_caja, precio_blister, precio_unidad, precio_venta_caja, 
                                 precio_venta_blister, precio_venta_unidad, blisters_por_caja, unidades_por_blister, 
                                 stock_caja, stock_blister, stock_unidad, nivel_reorden, codigo_barras, proveedor_id, 
                                 laboratorio_id, fecha_vencimiento) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    farmaco.id,
                                    farmaco.nombre,
                                    farmaco.presentacion,
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
                                    resolve(farmaco.id); // Devuelve el id del nuevo fármaco
                                }
                            );
                        }
                    });
                });
            };

            // Ejecutar las inserciones/actualizaciones de los fármacos de forma secuencial
            const upsertAllFarmacos = async () => {
                const farmacoIds = []; // Array para almacenar los IDs de los fármacos

                for (const farmaco of farmacos) {
                    try {
                        const farmacoId = await upsertFarmaco(farmaco);
                        farmacoIds.push(farmacoId); // Guardar el id del fármaco procesado
                    } catch (error) {
                        return Promise.reject(error);
                    }
                }
                return farmacoIds; // Retorna los IDs de los fármacos procesados
            };

            // Intentar insertar o actualizar todos los fármacos y finalizar la transacción
            upsertAllFarmacos()
                .then((farmacoIds) => {
                    // Inserción en la tabla detalle_compras
                    const detallePromises = farmacos.map((farmaco, index) => {
                        const cantidad = Math.max(farmaco.stock_caja, farmaco.stock_blister, farmaco.stock_unidad); // Obtener el stock más alto
                        return new Promise((resolve, reject) => {
                            const detalleParams = [
                                Nofactura,
                                farmacoIds[index], // Usar el ID del fármaco procesado
                                cantidad
                            ];
                            connection.query(
                                `INSERT INTO detalle_compras (Nofactura, farmaco_id, cantidad) VALUES (?, ?, ?)`,
                                detalleParams, (err) => {
                                    if (err) {
                                        return reject(new Error('Error al insertar en detalle_compras: ' + err.message));
                                    }
                                    resolve();
                                }
                            );
                        });
                    });

                    return Promise.all(detallePromises); // Esperar a que todas las inserciones en detalle_compras se completen
                })
                .then(() => {
                    connection.commit((err) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.end();
                                res.status(500).send({
                                    status: 'error',
                                    message: 'Error al confirmar transacción',
                                    error: err.message
                                });
                            });
                        }
                        connection.end();
                        res.status(200).send({
                            status: 'success',
                            message: 'Fármacos y compra registrados correctamente'
                        });
                    });
                })
                .catch((error) => {
                    connection.rollback(() => {
                        connection.end();
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
        f.presentacion,
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
///////////////////////////// Historial Compras ////////////////////////////////////////
app.get('/api/historial_compras', (req, res) => {
    var connection = mysql.createConnection(credentials);
    const query = `
        SELECT 
        c.id, 
        c.proveedor_id,  
        c.total_compra, 
        c.fecha_compra,
        c.Nofactura,
        c.tipo_documento_id,  
        p.nombre AS proveedor, 
        t.nombre_documento AS tipo_documento
    FROM 
        compras c 
    JOIN 
        proveedores p ON c.proveedor_id = p.id
    JOIN 
        tipo_documento t ON c.tipo_documento_id = t.id;

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
app.get('/api/detalle_compras/:Nofactura', (req, res) => {
    const { Nofactura } = req.params;
    const connection = mysql.createConnection(credentials);

    const query = `
        SELECT 
                dc.id AS detalle_id,
                dc.Nofactura,
                c.tipo_documento_id,
                tp.nombre_documento AS tipo_documento,
                f.nombre AS nombre_farmaco,
                dc.cantidad,
                GREATEST(f.precio_caja, f.precio_blister, f.precio_unidad) AS precio_compra,
                (dc.cantidad * GREATEST(f.precio_caja, f.precio_blister, f.precio_unidad)) AS total_farmaco,
                c.total_compra
            FROM 
                detalle_compras dc
            INNER JOIN 
                farmacos f ON dc.farmaco_id = f.id
            INNER JOIN 
                compras c ON dc.Nofactura = c.Nofactura
            INNER JOIN 
                tipo_documento tp ON c.tipo_documento_id = tp.id
            WHERE 
                dc.Nofactura = ?;
    `;

    connection.query(query, [Nofactura], (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else if (rows.length === 0) {
            res.status(404).send('No se encontraron detalles para esta factura.');
        } else {
            // Enviar todos los resultados, no solo el primero
            res.status(200).send(rows); // Cambiar aquí para enviar `rows` en lugar de `rows[0]`
        }
        connection.end();
    });
});
////////////////////////////////Ventas/////////////////////////////////////////////////
app.get('/api/farmaco_venta/:id', (req, res) => {
    const { id } = req.params;
    const connection = mysql.createConnection(credentials);
  
    const query = `
     SELECT 
        f.nombre,
        f.precio_venta_caja, 
        f.precio_venta_blister, 
        f.precio_venta_unidad, 
        f.presentacion 
        FROM farmacos f 
        WHERE f.id = ? AND (f.stock_caja > 0 OR f.stock_blister > 0 OR f.stock_unidad > 0)
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
app.post('/api/guardar_farmaco_venta', (req, res) => {
    const { total_venta, farmacos, Nofactura, nombre_cliente, nit } = req.body;

    // Verificación de parámetros
    if (!total_venta || !farmacos || !Nofactura || !nombre_cliente || !nit) {
        return res.status(400).send({ status: 'error', message: 'Faltan datos en la solicitud' });
    }

    const ventaParams = [nombre_cliente, nit, total_venta, Nofactura];
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
        connection.query('INSERT INTO ventas (nombre_cliente, nit, total_venta, Nofactura) VALUES (?, ?, ?, ?)', ventaParams, (err, result) => {
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
                    const { id, cantidad, presentacion } = farmaco;

                    // Consultar stock actual y detalles de la presentación
                    connection.query('SELECT stock_unidad, stock_blister, stock_caja, blisters_por_caja, unidades_por_blister FROM farmacos WHERE id = ?', [id], (err, rows) => {
                        if (err) {
                            return reject(new Error('Error al verificar fármaco: ' + err.message));
                        }

                        if (rows.length > 0) {
                            const { stock_unidad, stock_blister, stock_caja, blisters_por_caja, unidades_por_blister } = rows[0];

                            // Lógica para presentación "unidad"
                            if (presentacion === 'unidad') {
                                let unidades_a_disminuir = cantidad;
                                let nuevasUnidades = stock_unidad - unidades_a_disminuir;
                                let nuevosBlisters = stock_blister;
                                let nuevasCajas = stock_caja;

                                // Si las unidades no son suficientes, descontamos de los blisters
                                if (nuevasUnidades < 0) {
                                    let unidades_faltantes = Math.abs(nuevasUnidades);
                                    let blisters_necesarios = Math.ceil(unidades_faltantes / unidades_por_blister);
                                    nuevosBlisters = nuevosBlisters - blisters_necesarios;
                                    nuevasUnidades = (blisters_necesarios * unidades_por_blister) - unidades_faltantes;

                                    if (nuevosBlisters < 0) {
                                        let blisters_faltantes = Math.abs(nuevosBlisters);
                                        let cajas_necesarias = Math.ceil(blisters_faltantes / blisters_por_caja);
                                        nuevasCajas = stock_caja - cajas_necesarias;
                                        nuevosBlisters = (cajas_necesarias * blisters_por_caja) - blisters_faltantes;
                                    }
                                }

                                const updateQuery = `
                                    UPDATE farmacos
                                    SET stock_unidad = GREATEST(?, 0),
                                        stock_blister = GREATEST(?, 0),
                                        stock_caja = GREATEST(?, 0)
                                    WHERE id = ?`;

                                const updateParams = [nuevasUnidades, nuevosBlisters, nuevasCajas, id];

                                connection.query(updateQuery, updateParams, (err) => {
                                    if (err) {
                                        return reject(new Error('Error al actualizar el stock del fármaco: ' + err.message));
                                    }
                                    resolve();
                                });
                            } else if (presentacion === 'blister') {
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
                            } else if (presentacion === 'caja') {
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

            // Guardar detalles de la venta
            const saveDetalleVentas = (farmaco) => {
                return new Promise((resolve, reject) => {
                    const { id, cantidad } = farmaco;
                    const detalleParams = [Nofactura, id, cantidad];

                    connection.query('INSERT INTO detalle_ventas (Nofactura, farmaco_id, cantidad) VALUES (?, ?, ?)', detalleParams, (err) => {
                        if (err) {
                            return reject(new Error('Error al insertar detalle de venta: ' + err.message));
                        }
                        resolve();
                    });
                });
            };

            // Actualizar el stock para cada fármaco en el array
            const promises = farmacos.map(farmaco => {
                return Promise.all([
                    updateFarmacoStock(farmaco),
                    saveDetalleVentas(farmaco)
                ]);
            });

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
////////////////////////////////////// Historila ventas ////////////////////////////////

app.get('/api/historial_ventas', (req, res) => {
    var connection = mysql.createConnection(credentials);
    connection.query('SELECT * FROM ventas', (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.get('/api/detalle_ventas/:Nofactura', (req, res) => {
    const { Nofactura } = req.params;
    const connection = mysql.createConnection(credentials);

    const query = `
       SELECT 
            dv.id AS detalle_id,
            dv.Nofactura,
            f.nombre AS nombre_farmaco,
            dv.cantidad,
            GREATEST(f.precio_venta_caja, f.precio_venta_blister, f.precio_venta_unidad) AS precio_venta,
            (dv.cantidad * GREATEST(f.precio_venta_caja, f.precio_venta_blister, f.precio_venta_unidad)) AS total_farmaco,
            v.total_venta
        FROM 
            detalle_ventas dv
        INNER JOIN 
            farmacos f ON dv.farmaco_id = f.id
        INNER JOIN 
            ventas v ON dv.Nofactura = v.Nofactura
        WHERE 
            dv.Nofactura = ?;

    `;

    connection.query(query, [Nofactura], (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else if (rows.length === 0) {
            res.status(404).send('No se encontraron detalles para esta factura.');
        } else {
            // Enviar todos los resultados, no solo el primero
            res.status(200).send(rows); // Cambiar aquí para enviar `rows` en lugar de `rows[0]`
        }
        connection.end();
    });
});

/////////////////////// Notificaciones /////////////////////////
app.get('/api/stock_bajo', (req, res) => {
    var connection = mysql.createConnection(credentials);
    const query = `
        SELECT 
            id, 
            nombre, 
            stock_total_calculado, 
            nivel_reorden
        FROM 
            farmacos
        WHERE 
            stock_total_calculado <= nivel_reorden;
    `;
    
    connection.query(query, (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});

app.get('/api/farmacos_prontos_a_vencer', (req, res) => {
    var connection = mysql.createConnection(credentials);
    const query = `
        SELECT 
            id, 
            nombre, 
            fecha_vencimiento
        FROM 
            farmacos
        WHERE 
            fecha_vencimiento <= CURDATE() + INTERVAL 30 DAY
        AND 
            fecha_vencimiento IS NOT NULL;
    `;
    
    connection.query(query, (err, rows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(rows);
        }
    });
    connection.end();
});






app.listen(5000, () => {
    console.log('Server 5000, funciona :)');
});

 