/**
 * ==========================================================================
 * KPI.JS - Renderizado de Tarjetas de Métricas Clave
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - 0 innerHTML: Construido exclusivamente mediante document.createElement()
 * ==========================================================================
 */

import { createEl, clearElement, formatCOP } from '../dom.js';

/**
 * Renderiza una tarjeta de KPI individual.
 */
const renderKpiCard = (title, value, unit, badgeText, badgeClass, iconSymbol, footerDesc) => {
  const labelEl = createEl('span', { className: 'kpi-label', text: title });
  const iconEl = createEl('div', { className: 'kpi-icon-wrapper', text: iconSymbol });
  const headerEl = createEl('div', { className: 'kpi-header' }, [labelEl, iconEl]);

  const valueEl = createEl('span', { className: 'kpi-main-value', text: value });
  const childrenValue = [valueEl];
  if (unit) {
    childrenValue.push(createEl('span', { className: 'kpi-unit', text: unit }));
  }
  const valueRow = createEl('div', { className: 'kpi-value-row' }, childrenValue);

  const badgeEl = createEl('span', { className: `kpi-badge-pill ${badgeClass}`, text: badgeText });
  const descEl = createEl('span', { text: footerDesc });
  const footerEl = createEl('div', { className: 'kpi-footer' }, [badgeEl, descEl]);

  return createEl('article', { className: 'kpi-card' }, [headerEl, valueRow, footerEl]);
};

/**
 * Renderiza el conjunto completo de KPIs en el contenedor especificado.
 * @param {HTMLElement} container
 * @param {Object} summary - Objeto de métricas calculado en appState
 */
export const renderKpis = (container, summary) => {
  if (!container) return;
  clearElement(container);

  const {
    tasaOcupacion = 0,
    totalHoras = 0,
    totalIngresos = 0,
    franjaPico = '--',
    canchaEstrella = '--'
  } = summary || {};

  const card1 = renderKpiCard(
    'Tasa de Ocupación',
    `${tasaOcupacion}%`,
    null,
    tasaOcupacion >= 50 ? 'Alta Demanda' : 'Moderada',
    tasaOcupacion >= 50 ? 'badge-success' : 'badge-warning',
    '⚡',
    'vs. capacidad total'
  );

  const card2 = renderKpiCard(
    'Horas Reservadas',
    totalHoras.toLocaleString('es-CO'),
    'hrs',
    'Ocupación Efectiva',
    'badge-info',
    '⏱',
    'en período seleccionado'
  );

  const card3 = renderKpiCard(
    'Recaudo Estimado',
    formatCOP(totalIngresos),
    null,
    'Ingresos Brutos',
    'badge-warning',
    '💰',
    'partidos facturados'
  );

  const card4 = renderKpiCard(
    'Franja Horaria Pico',
    franjaPico,
    null,
    'Mayor Afluencia',
    'badge-purple',
    '🔥',
    'demanda concentrada'
  );

  const card5 = renderKpiCard(
    'Cancha Estrella',
    canchaEstrella,
    null,
    'Líder en Uso',
    'badge-info',
    '⭐',
    'mayor ocupación'
  );

  container.appendChild(card1);
  container.appendChild(card2);
  container.appendChild(card3);
  container.appendChild(card4);
  container.appendChild(card5);
};
