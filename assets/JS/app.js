/**
 * ==========================================================================
 * APP.JS - Orquestador Principal del Sistema
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - 0 innerHTML, 0 var, 0 librerías externas
 * - Integración reactiva del estado central con componentes
 * ==========================================================================
 */

import { createEl, clearElement } from './dom.js';
import { appState, subscribe, setRawData } from './state.js';
import { fetchDashboardData, testAndSaveSupabaseCredentials, resetToLocalData } from './api.js';
import { showToast, openModal, closeModal } from './components/feedback.js';
import { renderKpis } from './components/kpi.js';
import { renderHeatmap, renderFormatDistribution } from './components/charts.js';
import { renderFilters } from './components/filters.js';
import { renderTable } from './components/table.js';

// Nodos contenedores del DOM
const kpiSection = document.getElementById('kpi-section');
const filtersSection = document.getElementById('filters-section');
const heatmapContainer = document.getElementById('heatmap-container');
const formatBarsContainer = document.getElementById('format-bars-container');
const tableSection = document.getElementById('table-section');
const dataSourceLabel = document.getElementById('data-source-label');
const btnOpenSupabaseModal = document.getElementById('btn-open-supabase-modal');
const btnReloadData = document.getElementById('btn-reload-data');
const btnAboutApp = document.getElementById('btn-about-app');

/**
 * Renderiza todos los módulos analíticos cuando el estado cambia.
 * @param {Object} state - appState
 */
const handleStateChange = (state) => {
  renderKpis(kpiSection, state.filteredData.summary);
  renderHeatmap(heatmapContainer, state.filteredData.summary.matrizSemanal);
  renderFormatDistribution(formatBarsContainer, state.filteredData.summary.distribucionFormatos);
  renderFilters(filtersSection, state);
  renderTable(tableSection, state);

  // Actualizar indicador de fuente de datos
  if (dataSourceLabel) {
    if (state.ui.dataSource === 'supabase') {
      dataSourceLabel.textContent = 'Supabase (En vivo)';
      dataSourceLabel.style.color = '#10b981';
    } else {
      dataSourceLabel.textContent = 'Datos Locales (Pereira)';
      dataSourceLabel.style.color = 'var(--text-secondary)';
    }
  }
};

/**
 * Carga inicial de datos desde la API o el dataset local.
 */
const loadApplicationData = async () => {
  try {
    const data = await fetchDashboardData();
    setRawData(data, data.source);
    showToast(
      'Datos Actualizados',
      data.source === 'supabase' 
        ? 'Se sincronizó exitosamente con la base de datos de Supabase.' 
        : 'Cargado dataset de canchas de Pereira (Simulación de alta fidelidad).',
      'success',
      3000
    );
  } catch (err) {
    console.error('Error al cargar datos:', err);
    showToast('Error de Carga', 'No se pudieron cargar los datos de ocupación.', 'error', 4000);
  }
};

/**
 * Modal para configuración de conexión con Supabase (REST PostgREST).
 */
const openSupabaseModal = () => {
  const currentUrl = localStorage.getItem('supabase_url') || '';
  const currentKey = localStorage.getItem('supabase_anon_key') || '';

  const inputUrl = createEl('input', {
    attrs: {
      type: 'url',
      placeholder: 'https://xyzcompany.supabase.co',
      value: currentUrl,
      style: 'width: 100%; padding: 0.65rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-md);'
    }
  });

  const inputKey = createEl('input', {
    attrs: {
      type: 'password',
      placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      value: currentKey,
      style: 'width: 100%; padding: 0.65rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-md);'
    }
  });

  const modalBody = createEl('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' }, [
    createEl('p', {
      text: 'Conecta tu propia base de datos PostgreSQL en Supabase sin SDKs ni dependencias externas. La aplicación consultará directamente los endpoints PostgREST mediante fetch().'
    }),
    createEl('div', {}, [
      createEl('label', { text: 'Project URL de Supabase:', style: 'display: block; font-weight: 600; margin-bottom: 0.25rem; font-size: 0.8rem;' }),
      inputUrl
    ]),
    createEl('div', {}, [
      createEl('label', { text: 'Anon / Public API Key:', style: 'display: block; font-weight: 600; margin-bottom: 0.25rem; font-size: 0.8rem;' }),
      inputKey,
      createEl('small', {
        text: '⚠️ Seguridad: NUNCA utilices la Service Role Key. Solo la clave pública anon.',
        style: 'color: var(--color-warning); font-size: 0.75rem; display: block; margin-top: 0.25rem;'
      })
    ]),
    createEl('div', { style: 'padding: 0.75rem; background: var(--bg-card); border-radius: var(--radius-md); font-size: 0.775rem;' }, [
      createEl('strong', { text: '¿No tienes tablas creadas?' }),
      createEl('p', { text: 'Encuentra el script SQL de creación de tablas en: docs/supabase_schema.sql' })
    ])
  ]);

  openModal('Conexión con Supabase', modalBody, [
    {
      label: 'Restablecer a Datos Locales',
      className: 'btn-secondary',
      onClick: async (e, close) => {
        resetToLocalData();
        close();
        await loadApplicationData();
      }
    },
    {
      label: 'Probar y Guardar',
      className: 'btn-primary',
      onClick: async (e, close) => {
        const url = inputUrl.value.trim();
        const key = inputKey.value.trim();

        if (!url || !key) {
          showToast('Campos Incompletos', 'Por favor ingresa la URL y la Anon Key.', 'error');
          return;
        }

        showToast('Verificando...', 'Comprobando conexión con Supabase...', 'info', 2000);
        const result = await testAndSaveSupabaseCredentials(url, key);

        if (result.success) {
          showToast('Conectado', result.message, 'success');
          close();
          await loadApplicationData();
        } else {
          showToast('Fallo de Conexión', result.message, 'error', 4500);
        }
      }
    }
  ]);
};

/**
 * Modal informativo de la arquitectura de la aplicación.
 */
const openAboutModal = () => {
  const content = createEl('div', { style: 'display: flex; flex-direction: column; gap: 0.85rem;' }, [
    createEl('p', {
      text: 'Esta plataforma fue desarrollada cumpliendo estrictamente todas las normas del archivo AGENTS.md:'
    }),
    createEl('ul', { style: 'padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.6;' }, [
      createEl('li', { text: 'Cero librerías o frameworks externos (sin React, Tailwind, Chart.js, etc.).' }),
      createEl('li', { text: 'JavaScript nativo moderno (estrictamente const y let, cero uso de var).' }),
      createEl('li', { text: 'Manipulación segura del DOM con document.createElement() (cero innerHTML).' }),
      createEl('li', { text: 'Retroalimentación visual integrada en el DOM (cero alertas del navegador).' }),
      createEl('li', { text: 'Gráficos nativos (Heatmap interactivo en SVG y distribución en CSS Grid).' }),
      createEl('li', { text: 'Conector Supabase nativo vía fetch() PostgREST sin SDKs.' })
    ]),
    createEl('p', {
      text: 'Optimizada para la gestión operativa y análisis de ocupación de complejos deportivos en la ciudad de Pereira.',
      style: 'font-weight: 600; color: var(--color-turf);'
    })
  ]);

  openModal('Acerca del Sistema Analítico', content, [
    {
      label: 'Entendido',
      className: 'btn-primary',
      onClick: (e, close) => close()
    }
  ]);
};

// Vinculación de eventos globales
if (btnOpenSupabaseModal) {
  btnOpenSupabaseModal.addEventListener('click', openSupabaseModal);
}

if (btnReloadData) {
  btnReloadData.addEventListener('click', () => {
    loadApplicationData();
  });
}

if (btnAboutApp) {
  btnAboutApp.addEventListener('click', openAboutModal);
}

// Inicialización de la aplicación
subscribe(handleStateChange);
loadApplicationData();
