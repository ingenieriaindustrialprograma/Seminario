/**
 * ==========================================================================
 * DOM.JS - Utilidades puras de Manipulación Segura del DOM
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - PROHIBIDO: innerHTML, var, alert, confirm, prompt
 * - OBLIGATORIO: document.createElement(), appendChild(), const/let
 * ==========================================================================
 */

/**
 * Crea un elemento DOM de forma segura sin utilizar innerHTML.
 * @param {string} tag - Nombre de la etiqueta HTML (ej. 'div', 'span', 'button')
 * @param {Object} [options] - Atributos, clases, texto y manejadores de eventos
 * @param {Array<HTMLElement|Node|string>} [children] - Nodos hijos a adjuntar
 * @returns {HTMLElement}
 */
export const createEl = (tag, options = {}, children = []) => {
  const el = document.createElement(tag);

  if (options.className) {
    el.className = options.className;
  }

  if (options.id) {
    el.id = options.id;
  }

  if (options.text !== undefined && options.text !== null) {
    el.textContent = String(options.text);
  }

  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, String(value));
      }
    }
  }

  if (options.events) {
    for (const [eventName, handler] of Object.entries(options.events)) {
      if (typeof handler === 'function') {
        el.addEventListener(eventName, handler);
      }
    }
  }

  if (Array.isArray(children)) {
    for (const child of children) {
      if (!child) continue;
      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    }
  }

  return el;
};

/**
 * Crea un elemento SVG en el namespace correspondiente de forma segura.
 * @param {string} tag - Etiqueta SVG (ej. 'svg', 'rect', 'text', 'line')
 * @param {Object} [options] - Atributos del SVG
 * @param {Array<SVGElement>} [children]
 * @returns {SVGElement}
 */
export const createSvgEl = (tag, options = {}, children = []) => {
  const el = document.createAttributeNS ? 
    document.createElementNS('http://www.w3.org/2000/svg', tag) : 
    document.createElement(tag);

  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, String(value));
      }
    }
  }

  if (options.className) {
    el.setAttribute('class', options.className);
  }

  if (options.text !== undefined && options.text !== null) {
    el.textContent = String(options.text);
  }

  if (options.events) {
    for (const [eventName, handler] of Object.entries(options.events)) {
      if (typeof handler === 'function') {
        el.addEventListener(eventName, handler);
      }
    }
  }

  if (Array.isArray(children)) {
    for (const child of children) {
      if (child instanceof Node) {
        el.appendChild(child);
      }
    }
  }

  return el;
};

/**
 * Limpia todos los elementos hijos de un contenedor de manera segura (0 innerHTML).
 * @param {HTMLElement} container
 */
export const clearElement = (container) => {
  if (!container) return;
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

/**
 * Formatea un número como moneda colombiana (COP).
 * @param {number} amount
 * @returns {string} Ej: "$ 120.000"
 */
export const formatCOP = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Formatea una fecha ISO a formato legible colombiano.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string} Ej: "08 Sep 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  return dateStr;
};

/**
 * Formatea la hora a formato HH:MM
 * @param {string} timeStr - 'HH:MM:SS' o 'HH:MM'
 * @returns {string}
 */
export const formatHour = (timeStr) => {
  if (!timeStr) return '--';
  return timeStr.slice(0, 5);
};
