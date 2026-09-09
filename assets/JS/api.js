/**
 * ==========================================================================
 * API.JS - Capa de Datos y Conector Nativo Supabase (PostgREST)
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - 0 Dependencias externas (usa fetch nativo de JavaScript)
 * - NUNCA expone Service Role Key (solo anon key)
 * - Manejo resiliente de errores y fallback al dataset de Pereira
 * ==========================================================================
 */

// Dataset representativo y realista de complejos deportivos en Pereira
const PEREIRA_MOCK_DATA = {
  sedes: [
    {
      id: "sede-01",
      nombre: "Complejo Maracaná Pereira",
      sector: "Circunvalar",
      direccion: "Av. Circunvalar # 12-45",
      telefono: "311-7894561",
      estado: "activo"
    },
    {
      id: "sede-02",
      nombre: "Canchas El Golazo Cuba",
      sector: "Cuba",
      direccion: "Cra. 25 # 68-10, Barrio Cuba",
      telefono: "314-5552390",
      estado: "activo"
    },
    {
      id: "sede-03",
      nombre: "La Bombonera Sintética",
      sector: "Álamos",
      direccion: "Calle 14 # 23-15, Los Álamos",
      telefono: "318-4439012",
      estado: "activo"
    },
    {
      id: "sede-04",
      nombre: "Camp Nou Cerritos Sports",
      sector: "Cerritos",
      direccion: "Km 8 Vía Cerritos - Pereira",
      telefono: "310-9988771",
      estado: "activo"
    },
    {
      id: "sede-05",
      nombre: "Arena Pinares F5 & F7",
      sector: "Pinares",
      direccion: "Cra. 18 # 11-30, Pinares",
      telefono: "315-3214567",
      estado: "activo"
    },
    {
      id: "sede-06",
      nombre: "Centro Deportivo del Otún",
      sector: "Dosquebradas / Área Metro",
      direccion: "Av. Ferrocarril # 19-02",
      telefono: "312-8877665",
      estado: "activo"
    }
  ],

  canchas: [
    { id: "c-01", sede_id: "sede-01", nombre: "Maracaná 1 (Techada)", tipo: "Fútbol 5", superficie: "Sintética Techada", tarifa_base_hora: 90000, estado: "disponible" },
    { id: "c-02", sede_id: "sede-01", nombre: "Maracaná 2 (F7)", tipo: "Fútbol 7", superficie: "Sintética al Aire Libre", tarifa_base_hora: 140000, estado: "disponible" },
    { id: "c-03", sede_id: "sede-02", nombre: "Golazo Central", tipo: "Fútbol 5", superficie: "Sintética Techada", tarifa_base_hora: 80000, estado: "disponible" },
    { id: "c-04", sede_id: "sede-02", nombre: "Golazo La Cantera", tipo: "Fútbol 8", superficie: "Sintética al Aire Libre", tarifa_base_hora: 160000, estado: "disponible" },
    { id: "c-05", sede_id: "sede-03", nombre: "Bombonera Norte", tipo: "Fútbol 5", superficie: "Sintética Techada", tarifa_base_hora: 85000, estado: "disponible" },
    { id: "c-06", sede_id: "sede-03", nombre: "Bombonera Sur (F7)", tipo: "Fútbol 7", superficie: "Sintética al Aire Libre", tarifa_base_hora: 130000, estado: "disponible" },
    { id: "c-07", sede_id: "sede-04", nombre: "Cerritos Gran Cancha", tipo: "Fútbol 11", superficie: "Sintética al Aire Libre", tarifa_base_hora: 220000, estado: "disponible" },
    { id: "c-08", sede_id: "sede-04", nombre: "Cerritos Express", tipo: "Fútbol 5", superficie: "Sintética Techada", tarifa_base_hora: 100000, estado: "disponible" },
    { id: "c-09", sede_id: "sede-05", nombre: "Pinares Premium 1", tipo: "Fútbol 5", superficie: "Sintética Techada", tarifa_base_hora: 95000, estado: "disponible" },
    { id: "c-10", sede_id: "sede-05", nombre: "Pinares F7", tipo: "Fútbol 7", superficie: "Sintética al Aire Libre", tarifa_base_hora: 150000, estado: "disponible" },
    { id: "c-11", sede_id: "sede-06", nombre: "Otún Sintética 1", tipo: "Fútbol 5", superficie: "Sintética Techada", tarifa_base_hora: 75000, estado: "disponible" },
    { id: "c-12", sede_id: "sede-06", nombre: "Otún Estadio F8", tipo: "Fútbol 8", superficie: "Sintética al Aire Libre", tarifa_base_hora: 150000, estado: "disponible" }
  ],

  reservas: []
};

// Generación determinista y realista de 90 reservas históricas y recientes para Pereira
const generarReservasSimuladas = () => {
  const horasPosibles = [
    "09:00", "10:00", "11:00", "14:00", "16:00",
    "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];
  const tiposCliente = ["Frecuente", "Esporádico", "Torneo Nocturno", "Empresarial"];
  const metodosPago = ["Transferencia Nequi/Daviplata", "Efectivo", "Tarjeta"];
  const estados = ["completada", "completada", "completada", "en_curso", "cancelada"];

  const hoy = new Date();
  const reservas = [];
  let contador = 1;

  for (let d = 0; d < 14; d++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - d);
    const fechaStr = fecha.toISOString().split('T')[0];

    // Más reservas viernes, sábados y domingos en Pereira
    const diaSemana = fecha.getDay();
    const esFinSemana = diaSemana === 5 || diaSemana === 6 || diaSemana === 0;
    const cantidadReservasDia = esFinSemana ? 10 : 6;

    for (let r = 0; r < cantidadReservasDia; r++) {
      const canchaIndex = (contador + r) % PEREIRA_MOCK_DATA.canchas.length;
      const cancha = PEREIRA_MOCK_DATA.canchas[canchaIndex];
      const horaInicio = horasPosibles[(r * 2 + d) % horasPosibles.length];
      const horaNum = parseInt(horaInicio.split(':')[0], 10);
      const horaFin = `${(horaNum + 1).toString().padStart(2, '0')}:00`;

      const estado = estados[(r + d) % estados.length];
      const tipoCliente = tiposCliente[(r + contador) % tiposCliente.length];
      const metodoPago = metodosPago[(r + d) % metodosPago.length];
      const valorPagado = cancha.tarifa_base_hora;

      reservas.push({
        id: `res-${contador.toString().padStart(3, '0')}`,
        cancha_id: cancha.id,
        fecha: fechaStr,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: estado,
        valor_pagado: valorPagado,
        tipo_cliente: tipoCliente,
        metodo_pago: metodoPago
      });

      contador++;
    }
  }

  return reservas;
};

PEREIRA_MOCK_DATA.reservas = generarReservasSimuladas();

/**
 * Carga los datos de la aplicación.
 * Si existen credenciales de Supabase guardadas, consulta PostgREST de forma nativa con fetch().
 * De lo contrario, retorna inmediatamente el dataset simulado de Pereira.
 * @returns {Promise<{ sedes: Array, canchas: Array, reservas: Array, source: string }>}
 */
export const fetchDashboardData = async () => {
  const supabaseUrl = localStorage.getItem('supabase_url');
  const supabaseAnonKey = localStorage.getItem('supabase_anon_key');

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      const headers = {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      };

      const [sedesRes, canchasRes, reservasRes] = await Promise.all([
        fetch(`${cleanUrl}/rest/v1/sedes?select=*`, { headers }),
        fetch(`${cleanUrl}/rest/v1/canchas?select=*`, { headers }),
        fetch(`${cleanUrl}/rest/v1/reservas_ocupacion?select=*`, { headers })
      ]);

      if (sedesRes.ok && canchasRes.ok && reservasRes.ok) {
        const sedes = await sedesRes.json();
        const canchas = await canchasRes.json();
        const reservas = await reservasRes.json();

        return {
          sedes,
          canchas,
          reservas,
          source: 'supabase'
        };
      }
    } catch (err) {
      console.warn('Conexión con Supabase no disponible. Usando dataset local de Pereira.', err);
    }
  }

  // Fallback transparente al dataset local
  return {
    sedes: PEREIRA_MOCK_DATA.sedes,
    canchas: PEREIRA_MOCK_DATA.canchas,
    reservas: PEREIRA_MOCK_DATA.reservas,
    source: 'local'
  };
};

/**
 * Prueba y guarda credenciales de conexión con Supabase.
 * @param {string} url
 * @param {string} anonKey
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const testAndSaveSupabaseCredentials = async (url, anonKey) => {
  if (!url || !anonKey) {
    return { success: false, message: 'La URL y la Anon Key de Supabase son obligatorias.' };
  }

  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  try {
    const res = await fetch(`${cleanUrl}/rest/v1/sedes?select=count`, {
      method: 'HEAD',
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`
      }
    });

    if (res.ok || res.status === 200 || res.status === 206) {
      localStorage.setItem('supabase_url', cleanUrl);
      localStorage.setItem('supabase_anon_key', cleanKey);
      return { success: true, message: '¡Conexión exitosa con Supabase! Recargando datos.' };
    } else {
      return { success: false, message: `Error de autenticación con Supabase (Código HTTP ${res.status}). Verifica tus credenciales.` };
    }
  } catch (err) {
    return { success: false, message: `No se pudo alcanzar el endpoint de Supabase: ${err.message}` };
  }
};

/**
 * Restaura la conexión a datos simulados locales eliminando las credenciales almacenadas.
 */
export const resetToLocalData = () => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
};
