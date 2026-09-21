// Vercel Serverless Function: api/verify-password.js
// Valida las contraseñas en el servidor sin exponerlas jamás al navegador ni al HTML.

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido. Utiliza POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const { module: modNum, session: reqSession, password } = body || {};

    if (!password || (!modNum && !reqSession)) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar la contraseña y el módulo o sesión que deseas desbloquear.'
      });
    }

    // Identificar a qué sesión corresponde el módulo
    let session = reqSession;
    if (!session && modNum) {
      const num = parseInt(modNum, 10);
      if (num === 3 || num === 4) session = 2;
      else if (num === 5 || num === 6) session = 3;
      else session = 1;
    }
    session = parseInt(session, 10);

    // Cargar contraseñas:
    // 1. De Variables de Entorno de Vercel (máxima seguridad)
    // 2. Del archivo local passwords.json
    let sessionPasswords = {
      2: process.env.PASSWORD_SESION_2,
      3: process.env.PASSWORD_SESION_3
    };
    let masterPassword = process.env.PASSWORD_MASTER;

    // Si falta alguna en process.env, intentar leer passwords.json
    try {
      const configPath = path.join(process.cwd(), 'passwords.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        const json = JSON.parse(raw);
        if (json.sessions) {
          if (!sessionPasswords[2] && json.sessions['2']?.password) {
            sessionPasswords[2] = json.sessions['2'].password;
          }
          if (!sessionPasswords[3] && json.sessions['3']?.password) {
            sessionPasswords[3] = json.sessions['3'].password;
          }
        }
        if (!masterPassword && json.masterPassword) {
          masterPassword = json.masterPassword;
        }
      }
    } catch (err) {
      console.warn('No se pudo leer passwords.json:', err.message);
    }

    // Valores por defecto si no están definidos en ninguna parte
    if (!sessionPasswords[2]) sessionPasswords[2] = 'gth-oct3';
    if (!sessionPasswords[3]) sessionPasswords[3] = 'gth-oct10';
    if (!masterPassword) masterPassword = 'admin-gth-2026';

    const cleanInput = String(password).trim();

    // Verificación de clave maestra (desbloquea todo)
    if (cleanInput === masterPassword) {
      return res.status(200).json({
        success: true,
        session: 'all',
        unlockedModules: [1, 2, 3, 4, 5, 6],
        message: 'Acceso total concedido (Clave Maestra).'
      });
    }

    // Verificación de la sesión solicitada
    const expectedPassword = sessionPasswords[session];
    if (expectedPassword && cleanInput === expectedPassword) {
      const unlockedModules = session === 2 ? [3, 4] : session === 3 ? [5, 6] : [1, 2];
      return res.status(200).json({
        success: true,
        session: session,
        unlockedModules: unlockedModules,
        message: `Módulos desbloqueados con éxito para la sesión ${session}.`
      });
    }

    // Si la clave ingresada corresponde a la otra sesión, desbloquear esa sesión
    for (const [sKey, sPass] of Object.entries(sessionPasswords)) {
      if (sPass && cleanInput === sPass) {
        const sNum = parseInt(sKey, 10);
        const unlocked = sNum === 2 ? [3, 4] : sNum === 3 ? [5, 6] : [];
        return res.status(200).json({
          success: true,
          session: sNum,
          unlockedModules: unlocked,
          message: `Módulos de la sesión ${sNum} desbloqueados con éxito.`
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Contraseña incorrecta. Verifica e intenta nuevamente.'
    });
  } catch (error) {
    console.error('Error en verify-password:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno en el servidor de validación.'
    });
  }
};
