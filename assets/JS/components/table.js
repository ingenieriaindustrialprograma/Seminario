/**
 * ==========================================================================
 * TABLE.JS - Tabla Dinámica de Ocupación con Paginación y Ordenación
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - 0 innerHTML: Semántica HTML5 (table, thead, tbody, tr, th, td) en DOM puro
 * - Manejo de estados vacíos y modales integrados en el DOM
 * ==========================================================================
 */

import { createEl, clearElement, formatCOP, formatDate, formatHour } from '../dom.js';
import { appState, toggleTableSort, setTablePage, setSearchQuery, updateFilters } from '../state.js';
import { openModal } from './feedback.js';

/**
 * Renderiza la tabla completa y sus controles de paginación.
 * @param {HTMLElement} container
 * @param {Object} state - appState
 */
export const renderTable = (container, state) => {
  if (!container) return;
  clearElement(container);

  const { sedes, canchas } = state.rawData;
  const { reservas } = state.filteredData;
  const { tablePage, tablePageSize, tableSortField, tableSortAsc, searchQuery } = state.ui;

  const sedeMap = new Map();
  for (const s of sedes) {
    sedeMap.set(String(s.id), s);
  }

  const canchaMap = new Map();
  for (const c of canchas) {
    canchaMap.set(String(c.id), c);
  }

  // 1. Barra superior de la tabla: Buscador en vivo
  const searchInput = createEl('input', {
    className: 'table-search-input',
    attrs: {
      type: 'search',
      placeholder: 'Buscar por cliente, cancha o sede...',
      value: searchQuery,
      'aria-label': 'Buscar en la tabla de reservas'
    },
    events: {
      input: (e) => setSearchQuery(e.target.value)
    }
  });

  const totalCountText = createEl('span', {
    className: 'pagination-info',
    text: `Mostrando ${reservas.length} registro(s) encontrado(s)`
  });

  const toolbar = createEl('div', { className: 'table-toolbar' }, [searchInput, totalCountText]);

  // Si no hay resultados tras los filtros
  if (reservas.length === 0) {
    const emptyIcon = createEl('div', { className: 'empty-state-icon', text: '⚽' });
    const emptyTitle = createEl('h4', { className: 'empty-state-title', text: 'No se encontraron reservas' });
    const emptyDesc = createEl('p', {
      className: 'empty-state-desc',
      text: 'No existen registros para los filtros seleccionados. Intenta ajustar el sector o período.'
    });
    const emptyBtn = createEl('button', {
      className: 'btn btn-secondary btn-sm',
      text: 'Limpiar Filtros',
      events: {
        click: () => {
          updateFilters({
            periodo: 'todos',
            sector: 'todos',
            sedeId: 'todos',
            tipoCancha: 'todos',
            franjaHoraria: 'todos'
          });
          setSearchQuery('');
        }
      }
    });

    const emptyState = createEl('div', { className: 'empty-state' }, [emptyIcon, emptyTitle, emptyDesc, emptyBtn]);
    container.appendChild(toolbar);
    container.appendChild(emptyState);
    return;
  }

  // 2. Paginación
  const totalPages = Math.ceil(reservas.length / tablePageSize) || 1;
  const currentPage = Math.min(Math.max(1, tablePage), totalPages);
  const startIndex = (currentPage - 1) * tablePageSize;
  const pageItems = reservas.slice(startIndex, startIndex + tablePageSize);

  // 3. Encabezados de tabla
  const columns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'hora_inicio', label: 'Horario' },
    { key: 'sede', label: 'Sede & Sector' },
    { key: 'cancha', label: 'Cancha & Tipo' },
    { key: 'tipo_cliente', label: 'Cliente' },
    { key: 'valor_pagado', label: 'Tarifa' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: 'Acción', nonSortable: true }
  ];

  const headerCells = columns.map((col) => {
    const isSorted = tableSortField === col.key;
    const arrow = isSorted ? (tableSortAsc ? ' ↑' : ' ↓') : '';
    const thClass = col.nonSortable ? '' : 'sortable';

    return createEl(
      'th',
      {
        className: thClass,
        attrs: { scope: 'col', ...(isSorted ? { 'aria-sort': tableSortAsc ? 'ascending' : 'descending' } : {}) },
        text: `${col.label}${arrow}`,
        events: col.nonSortable ? {} : { click: () => toggleTableSort(col.key) }
      }
    );
  });

  const thead = createEl('thead', {}, [createEl('tr', {}, headerCells)]);

  // 4. Filas de datos
  const rows = pageItems.map((reserva) => {
    const cancha = canchaMap.get(String(reserva.cancha_id)) || { nombre: 'Cancha', tipo: '--' };
    const sede = sedeMap.get(String(cancha.sede_id)) || { nombre: 'Sede', sector: 'Pereira' };

    const tdFecha = createEl('td', { text: formatDate(reserva.fecha) });
    const tdHora = createEl('td', { text: `${formatHour(reserva.hora_inicio)} - ${formatHour(reserva.hora_fin)}` });

    const tdSede = createEl('td', {}, [
      createEl('strong', { text: sede.nombre }),
      createEl('br'),
      createEl('small', { text: `📍 Sector ${sede.sector}`, attrs: { style: 'color: var(--text-muted);' } })
    ]);

    const tdCancha = createEl('td', {}, [
      createEl('span', { text: cancha.nombre }),
      createEl('br'),
      createEl('small', { text: cancha.tipo, attrs: { style: 'color: var(--color-turf);' } })
    ]);

    const tdCliente = createEl('td', { text: reserva.tipo_cliente || 'Esporádico' });
    const tdValor = createEl('td', { text: formatCOP(reserva.valor_pagado) });

    const statusBadge = createEl('span', {
      className: `status-pill status-${reserva.estado || 'completada'}`,
      text: reserva.estado || 'Completada'
    });
    const tdEstado = createEl('td', {}, [statusBadge]);

    // Botón de detalle que abre modal seguro
    const btnDetalle = createEl('button', {
      className: 'btn btn-secondary btn-sm',
      text: 'Ver',
      attrs: { 'aria-label': `Ver detalle de reserva ${reserva.id}` },
      events: {
        click: () => openModalDetalleReserva(reserva, cancha, sede)
      }
    });
    const tdAcciones = createEl('td', {}, [btnDetalle]);

    return createEl('tr', {}, [tdFecha, tdHora, tdSede, tdCancha, tdCliente, tdValor, tdEstado, tdAcciones]);
  });

  const tbody = createEl('tbody', {}, rows);
  const table = createEl('table', { className: 'data-table' }, [thead, tbody]);
  const tableWrapper = createEl('div', { className: 'table-wrapper' }, [table]);

  // 5. Barra de Paginación
  const paginationInfo = createEl('span', {
    className: 'pagination-info',
    text: `Página ${currentPage} de ${totalPages} (Total: ${reservas.length} registros)`
  });

  const btnPrev = createEl('button', {
    className: 'page-btn',
    text: '‹ Anterior',
    attrs: { ...(currentPage <= 1 ? { disabled: 'disabled' } : {}), 'aria-label': 'Página anterior' },
    events: {
      click: () => setTablePage(currentPage - 1)
    }
  });

  const btnNext = createEl('button', {
    className: 'page-btn',
    text: 'Siguiente ›',
    attrs: { ...(currentPage >= totalPages ? { disabled: 'disabled' } : {}), 'aria-label': 'Página siguiente' },
    events: {
      click: () => setTablePage(currentPage + 1)
    }
  });

  const paginationNav = createEl('nav', { className: 'pagination-nav', attrs: { 'aria-label': 'Navegación de páginas' } }, [
    btnPrev,
    btnNext
  ]);

  const paginationContainer = createEl('div', { className: 'pagination-container' }, [paginationInfo, paginationNav]);

  container.appendChild(toolbar);
  container.appendChild(tableWrapper);
  container.appendChild(paginationContainer);
};

/**
 * Modal interactivo con información completa de la reserva.
 */
const openModalDetalleReserva = (reserva, cancha, sede) => {
  const content = createEl('div', { className: 'modal-detalle-grid' }, [
    createEl('p', {}, [createEl('strong', { text: 'Código Reserva: ' }), createEl('span', { text: reserva.id })]),
    createEl('p', {}, [createEl('strong', { text: 'Sede: ' }), createEl('span', { text: `${sede.nombre} (${sede.sector})` })]),
    createEl('p', {}, [createEl('strong', { text: 'Dirección: ' }), createEl('span', { text: sede.direccion || 'Pereira' })]),
    createEl('p', {}, [createEl('strong', { text: 'Cancha: ' }), createEl('span', { text: `${cancha.nombre} - ${cancha.tipo}` })]),
    createEl('p', {}, [createEl('strong', { text: 'Superficie: ' }), createEl('span', { text: cancha.superficie })]),
    createEl('p', {}, [createEl('strong', { text: 'Fecha: ' }), createEl('span', { text: formatDate(reserva.fecha) })]),
    createEl('p', {}, [createEl('strong', { text: 'Horario: ' }), createEl('span', { text: `${formatHour(reserva.hora_inicio)} a ${formatHour(reserva.hora_fin)}` })]),
    createEl('p', {}, [createEl('strong', { text: 'Tarifa Pagada: ' }), createEl('span', { text: formatCOP(reserva.valor_pagado) })]),
    createEl('p', {}, [createEl('strong', { text: 'Tipo de Cliente: ' }), createEl('span', { text: reserva.tipo_cliente })]),
    createEl('p', {}, [createEl('strong', { text: 'Método de Pago: ' }), createEl('span', { text: reserva.metodo_pago || 'Transferencia' })]),
    createEl('p', {}, [createEl('strong', { text: 'Estado: ' }), createEl('span', { className: `status-pill status-${reserva.estado}`, text: reserva.estado })])
  ]);

  openModal(`Detalle de Reserva #${reserva.id}`, content, [
    {
      label: 'Cerrar',
      className: 'btn-secondary',
      onClick: (e, close) => close()
    }
  ]);
};
