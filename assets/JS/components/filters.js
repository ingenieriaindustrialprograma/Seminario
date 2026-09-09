/**
 * ==========================================================================
 * FILTERS.JS - Barra de Filtros Dinámicos e Interdependientes
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - 0 innerHTML: Selects y opciones creados mediante document.createElement()
 * - Filtros interdependientes: Sede se actualiza según el Sector seleccionado
 * ==========================================================================
 */

import { createEl, clearElement } from '../dom.js';
import { appState, updateFilters } from '../state.js';

/**
 * Renderiza el panel interactivo de filtros.
 * @param {HTMLElement} container
 * @param {Object} state - appState
 */
export const renderFilters = (container, state) => {
  if (!container) return;
  clearElement(container);

  const { sedes } = state.rawData;
  const { periodo, sector, sedeId, tipoCancha, franjaHoraria } = state.filters;
  const countFiltered = state.filteredData.reservas.length;

  // Header del panel de filtros
  const titleEl = createEl('span', { className: 'filters-header-title', text: '🔍 Filtros Operativos de Pereira' });
  const countBadge = createEl('span', {
    className: 'filter-badge-count',
    text: `${countFiltered} reservas analizadas`
  });
  const headerEl = createEl('div', { className: 'filters-header' }, [titleEl, countBadge]);

  // 1. Selector de Período
  const periodoOptions = [
    { value: 'todos', label: 'Histórico Completo' },
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Últimos 7 Días' },
    { value: 'mes', label: 'Últimos 30 Días' }
  ];
  const selectPeriodo = createEl(
    'select',
    {
      id: 'filter-periodo',
      attrs: { 'aria-label': 'Filtrar por período de tiempo' },
      events: {
        change: (e) => updateFilters({ periodo: e.target.value })
      }
    },
    periodoOptions.map((opt) =>
      createEl('option', {
        attrs: { value: opt.value, ...(opt.value === periodo ? { selected: 'selected' } : {}) },
        text: opt.label
      })
    )
  );
  const fieldPeriodo = createEl('div', { className: 'filter-field' }, [
    createEl('label', { attrs: { for: 'filter-periodo' }, text: 'Período' }),
    selectPeriodo
  ]);

  // 2. Selector de Sector (Pereira)
  const sectoresUnicos = Array.from(new Set(sedes.map((s) => s.sector))).filter(Boolean);
  const sectorOptions = [
    { value: 'todos', label: 'Todos los Sectores' },
    ...sectoresUnicos.map((sec) => ({ value: sec, label: `Pereira - ${sec}` }))
  ];
  const selectSector = createEl(
    'select',
    {
      id: 'filter-sector',
      attrs: { 'aria-label': 'Filtrar por sector de Pereira' },
      events: {
        change: (e) => {
          // Si cambia el sector, restablece sedeId si ya no pertenece a ese sector
          updateFilters({ sector: e.target.value, sedeId: 'todos' });
        }
      }
    },
    sectorOptions.map((opt) =>
      createEl('option', {
        attrs: { value: opt.value, ...(opt.value === sector ? { selected: 'selected' } : {}) },
        text: opt.label
      })
    )
  );
  const fieldSector = createEl('div', { className: 'filter-field' }, [
    createEl('label', { attrs: { for: 'filter-sector' }, text: 'Sector' }),
    selectSector
  ]);

  // 3. Selector de Sede (Interdependiente del Sector)
  const sedesFiltradas = sector === 'todos' ? sedes : sedes.filter((s) => s.sector === sector);
  const sedeOptions = [
    { value: 'todos', label: 'Todas las Sedes' },
    ...sedesFiltradas.map((s) => ({ value: String(s.id), label: s.nombre }))
  ];
  const selectSede = createEl(
    'select',
    {
      id: 'filter-sede',
      attrs: { 'aria-label': 'Filtrar por sede específica' },
      events: {
        change: (e) => updateFilters({ sedeId: e.target.value })
      }
    },
    sedeOptions.map((opt) =>
      createEl('option', {
        attrs: { value: opt.value, ...(opt.value === String(sedeId) ? { selected: 'selected' } : {}) },
        text: opt.label
      })
    )
  );
  const fieldSede = createEl('div', { className: 'filter-field' }, [
    createEl('label', { attrs: { for: 'filter-sede' }, text: 'Sede / Complejo' }),
    selectSede
  ]);

  // 4. Selector de Tipo de Cancha
  const tiposCancha = ['Fútbol 5', 'Fútbol 7', 'Fútbol 8', 'Fútbol 11'];
  const tipoOptions = [
    { value: 'todos', label: 'Todos los Formatos' },
    ...tiposCancha.map((t) => ({ value: t, label: t }))
  ];
  const selectTipo = createEl(
    'select',
    {
      id: 'filter-tipo',
      attrs: { 'aria-label': 'Filtrar por formato de cancha' },
      events: {
        change: (e) => updateFilters({ tipoCancha: e.target.value })
      }
    },
    tipoOptions.map((opt) =>
      createEl('option', {
        attrs: { value: opt.value, ...(opt.value === tipoCancha ? { selected: 'selected' } : {}) },
        text: opt.label
      })
    )
  );
  const fieldTipo = createEl('div', { className: 'filter-field' }, [
    createEl('label', { attrs: { for: 'filter-tipo' }, text: 'Formato' }),
    selectTipo
  ]);

  // 5. Selector de Franja Horaria
  const franjaOptions = [
    { value: 'todos', label: 'Todo el Día (08:00 - 23:00)' },
    { value: 'manana', label: 'Mañana (08:00 - 12:00)' },
    { value: 'tarde', label: 'Tarde (12:00 - 18:00)' },
    { value: 'noche', label: 'Noche (18:00 - 23:00)' }
  ];
  const selectFranja = createEl(
    'select',
    {
      id: 'filter-franja',
      attrs: { 'aria-label': 'Filtrar por franja horaria' },
      events: {
        change: (e) => updateFilters({ franjaHoraria: e.target.value })
      }
    },
    franjaOptions.map((opt) =>
      createEl('option', {
        attrs: { value: opt.value, ...(opt.value === franjaHoraria ? { selected: 'selected' } : {}) },
        text: opt.label
      })
    )
  );
  const fieldFranja = createEl('div', { className: 'filter-field' }, [
    createEl('label', { attrs: { for: 'filter-franja' }, text: 'Horario' }),
    selectFranja
  ]);

  // 6. Botón de Restablecer
  const btnReset = createEl('button', {
    className: 'btn btn-secondary',
    text: 'Restablecer',
    attrs: { type: 'button', 'aria-label': 'Limpiar todos los filtros' },
    events: {
      click: () => {
        updateFilters({
          periodo: 'todos',
          sector: 'todos',
          sedeId: 'todos',
          tipoCancha: 'todos',
          franjaHoraria: 'todos'
        });
      }
    }
  });
  const fieldReset = createEl('div', { className: 'filter-field' }, [btnReset]);

  const controlsGrid = createEl('div', { className: 'filters-controls-grid' }, [
    fieldPeriodo,
    fieldSector,
    fieldSede,
    fieldTipo,
    fieldFranja,
    fieldReset
  ]);

  container.appendChild(headerEl);
  container.appendChild(controlsGrid);
};
