const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'registros.json');

// Crear el archivo si no existe
if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, JSON.stringify([], null, 2));
}

function guardarRegistro(evento, detalles) {
    const nuevoRegistro = {
        fecha: new Date().toISOString(),
        evento: evento,
        detalles: detalles
    };

    try {
        // Leer datos actuales
        const data = fs.readFileSync(logFilePath, 'utf8');
        const logs = JSON.parse(data || '[]');
        
        // Agregar el nuevo evento
        logs.push(nuevoRegistro);

        // Guardar de vuelta en el archivo JSON
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
        console.log(`[LOG] ${evento} registrado con éxito.`);
    } catch (error) {
        console.error('Error al escribir en el archivo de logs:', error);
    }
}

module.exports = { guardarRegistro };
