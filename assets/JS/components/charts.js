/**
 * ==========================================================================
 * CHARTS.JS - Visualizaciones Analíticas Nativas (SVG y CSS Grid)
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - 0 Dependencias externas (NO Chart.js, NO D3)
 * - 0 innerHTML: SVG y DOM construidos elemento a elemento
 * ==========================================================================
 */

import { createEl, createSvgEl, clearElement } from '../dom.js';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HORAS_OPERATIVAS = [
  '08', '09', '10', '11', '12', '13', '14', '15',
  '16', '17', '18', '19', '20', '21', '22', '23'
];

/**
 * Retorna el color cromático de calor según la cantidad de reservas en la celda.
 * @param {number} count
 * @returns {string} Código HEX
 */
const getHeatmapColor = (count) => {
  if (count === 0) return '#161f30';       // Vacío
  if (count === 1) return '#064e3b';       // Ocupación baja
  if (count === 2) return '#047857';       // Ocupación moderada
  if (count === 3) return '#10b981';       // Ocupación buena
  if (count === 4) return '#f59e0b';       // Ocupación alta (ámbar)
  return '#ef4444';                        // Saturación máxima (rojo)
};

/**
 * Renderiza la matriz de calor semanal en SVG nativo.
 * @param {HTMLElement} container
 * @param {Array<Array<number>>} matrizSemanal - 7 días x 16 franjas
 */
export const renderHeatmap = (container, matrizSemanal) => {
  if (!container) return;
  clearElement(container);

  const cellWidth = 34;
  const cellHeight = 24;
  const cellGap = 4;
  const offsetX = 48; // Espacio para nombres de los días
  const offsetY = 28; // Espacio para las horas

  const totalWidth = offsetX + (HORAS_OPERATIVAS.length * (cellWidth + cellGap)) + 10;
  const totalHeight = offsetY + (DIAS_SEMANA.length * (cellHeight + cellGap)) + 15;

  const svg = createSvgEl('svg', {
    className: 'heatmap-svg',
    attrs: {
      viewBox: `0 0 ${totalWidth} ${totalHeight}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': 'Mapa de calor de ocupación horaria semanal de canchas'
    }
  });

  // Etiquetas de horas (Eje X superior)
  for (let h = 0; h < HORAS_OPERATIVAS.length; h++) {
    const x = offsetX + (h * (cellWidth + cellGap)) + (cellWidth / 2);
    const textEl = createSvgEl('text', {
      attrs: {
        x: x,
        y: offsetY - 8,
        'text-anchor': 'middle',
        fill: '#9ca3af',
        'font-size': '10',
        'font-weight': '600'
      },
      text: `${HORAS_OPERATIVAS[h]}h`
    });
    svg.appendChild(textEl);
  }

  // Tooltip visual informativo en el DOM
  let tooltipNode = document.getElementById('heatmap-tooltip');
  if (!tooltipNode) {
    tooltipNode = createEl('div', {
      id: 'heatmap-tooltip',
      className: 'heatmap-tooltip-box',
      attrs: { style: 'position: absolute; display: none; pointer-events: none; z-index: 1000; background: #0f172a; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; border: 1px solid #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.5);' }
    });
    document.body.appendChild(tooltipNode);
  }

  // Filas de días y celdas
  for (let d = 0; d < DIAS_SEMANA.length; d++) {
    const y = offsetY + (d * (cellHeight + cellGap));

    // Etiqueta del día
    const dayLabel = createSvgEl('text', {
      attrs: {
        x: offsetX - 10,
        y: y + (cellHeight / 2) + 4,
        'text-anchor': 'end',
        fill: '#9ca3af',
        'font-size': '11',
        'font-weight': '600'
      },
      text: DIAS_SEMANA[d]
    });
    svg.appendChild(dayLabel);

    // Celdas horarias
    for (let h = 0; h < HORAS_OPERATIVAS.length; h++) {
      const count = (matrizSemanal && matrizSemanal[d] && matrizSemanal[d][h]) || 0;
      const x = offsetX + (h * (cellWidth + cellGap));
      const horaStr = HORAS_OPERATIVAS[h];
      const diaStr = DIAS_SEMANA[d];

      const rect = createSvgEl('rect', {
        className: 'heatmap-cell',
        attrs: {
          x: x,
          y: y,
          width: cellWidth,
          height: cellHeight,
          rx: 4,
          ry: 4,
          fill: getHeatmapColor(count),
          stroke: '#1e293b',
          'stroke-width': '1'
        },
        events: {
          mouseenter: (e) => {
            const rectBounds = e.target.getBoundingClientRect();
            tooltipNode.textContent = `${diaStr} a las ${horaStr}:00 - ${count} cancha(s) reservada(s)`;
            tooltipNode.style.display = 'block';
            tooltipNode.style.left = `${rectBounds.left + window.scrollX + cellWidth / 2}px`;
            tooltipNode.style.top = `${rectBounds.top + window.scrollY - 34}px`;
          },
          mouseleave: () => {
            tooltipNode.style.display = 'none';
          }
        }
      });

      svg.appendChild(rect);
    }
  }

  // Leyenda de intensidad
  const legendSteps = [
    { label: '0', color: '#161f30' },
    { label: '1', color: '#064e3b' },
    { label: '2', color: '#047857' },
    { label: '3', color: '#10b981' },
    { label: '4', color: '#f59e0b' },
    { label: '5+', color: '#ef4444' }
  ];

  const legendContainer = createEl('div', { className: 'heatmap-legend' });
  const legendLabel = createEl('span', { text: 'Nivel de ocupación: ' });
  const legendBar = createEl('div', { className: 'legend-bar' });

  for (const step of legendSteps) {
    const stepEl = createEl('div', {
      className: 'legend-step',
      attrs: {
        style: `background: ${step.color};`,
        title: `${step.label} reservas`
      }
    });
    legendBar.appendChild(stepEl);
  }

  const legendMax = createEl('span', { text: ' Alta' });
  legendContainer.appendChild(legendLabel);
  legendContainer.appendChild(legendBar);
  legendContainer.appendChild(legendMax);

  container.appendChild(svg);
  container.appendChild(legendContainer);
};

/**
 * Renderiza el gráfico de barras nativo de distribución por tipo de cancha.
 * @param {HTMLElement} container
 * @param {Object} distribucionFormatos - { 'Fútbol 5': count, ... }
 */
export const renderFormatDistribution = (container, distribucionFormatos = {}) => {
  if (!container) return;
  clearElement(container);

  const entries = Object.entries(distribucionFormatos);
  const total = entries.reduce((acc, [, val]) => acc + val, 0) || 1;

  const listContainer = createEl('div', { className: 'bars-list' });

  const colors = {
    'Fútbol 5': 'linear-gradient(90deg, #10b981, #059669)',
    'Fútbol 7': 'linear-gradient(90deg, #3b82f6, #2563eb)',
    'Fútbol 8': 'linear-gradient(90deg, #f59e0b, #d97706)',
    'Fútbol 11': 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
  };

  for (const [formato, count] of entries) {
    const pct = Math.round((count / total) * 100);

    const nameEl = createEl('span', { className: 'bar-name', text: formato });
    const valEl = createEl('span', { className: 'bar-val', text: `${count} hrs (${pct}%)` });
    const metaRow = createEl('div', { className: 'bar-meta' }, [nameEl, valEl]);

    const fillEl = createEl('div', {
      className: 'bar-fill',
      attrs: {
        style: `width: ${pct}%; background: ${colors[formato] || 'var(--color-turf)'};`
      }
    });

    const trackEl = createEl('div', { className: 'bar-track' }, [fillEl]);
    const itemEl = createEl('div', { className: 'bar-item' }, [metaRow, trackEl]);

    listContainer.appendChild(itemEl);
  }

  container.appendChild(listContainer);
};
