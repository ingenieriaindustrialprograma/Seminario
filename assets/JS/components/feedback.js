/**
 * ==========================================================================
 * FEEDBACK.JS - Sistema de Toasts y Modales 100% en el DOM
 * Web App de Análisis de Ocupación de Canchas Sintéticas - Pereira
 * Cumplimiento estricto con AGENTS.md:
 * - PROHIBIDO: alert(), confirm(), prompt()
 * - OBLIGATORIO: Crear elementos visuales en el DOM con document.createElement()
 * ==========================================================================
 */

import { createEl, clearElement } from '../dom.js';

let activeBackdrop = null;

/**
 * Muestra un Toast de notificación en pantalla.
 * @param {string} title
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [duration=3500]
 */
export const showToast = (title, message, type = 'info', duration = 3500) => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = createEl('div', { id: 'toast-container' });
    document.body.appendChild(container);
  }

  const titleEl = createEl('h4', { text: title });
  const descEl = createEl('p', { text: message });
  const contentEl = createEl('div', { className: 'toast-content' }, [titleEl, descEl]);

  const closeBtn = createEl('button', {
    className: 'toast-close-btn',
    attrs: { 'aria-label': 'Cerrar notificación' },
    text: '×',
    events: {
      click: () => removeToast(toastItem)
    }
  });

  const toastItem = createEl(
    'div',
    {
      className: `toast-item toast-${type}`,
      attrs: { role: 'status', 'aria-live': 'polite' }
    },
    [contentEl, closeBtn]
  );

  container.appendChild(toastItem);

  const timer = setTimeout(() => {
    removeToast(toastItem);
  }, duration);

  const removeToast = (item) => {
    clearTimeout(timer);
    item.style.opacity = '0';
    item.style.transform = 'translateX(50px)';
    item.style.transition = 'all 0.2s ease';
    setTimeout(() => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    }, 200);
  };
};

/**
 * Abre una ventana modal accesible en el DOM.
 * @param {string} title - Título del modal
 * @param {HTMLElement|Node} contentNode - Nodo DOM con el contenido
 * @param {Array<{ label: string, className?: string, onClick: Function }>} [actions=[]]
 */
export const openModal = (title, contentNode, actions = []) => {
  closeModal(); // Cierra cualquier modal previo

  const titleEl = createEl('h3', { text: title });
  const closeBtn = createEl('button', {
    className: 'modal-close-btn',
    attrs: { 'aria-label': 'Cerrar modal' },
    text: '×',
    events: {
      click: closeModal
    }
  });

  const headerEl = createEl('header', { className: 'modal-header' }, [titleEl, closeBtn]);
  const bodyEl = createEl('div', { className: 'modal-body' }, [contentNode]);

  const footerButtons = actions.map((action) => {
    return createEl('button', {
      className: `btn ${action.className || 'btn-secondary'}`,
      text: action.label,
      events: {
        click: (e) => {
          if (typeof action.onClick === 'function') {
            action.onClick(e, closeModal);
          }
        }
      }
    });
  });

  // Botón por defecto para cerrar si no se especificaron acciones
  if (footerButtons.length === 0) {
    footerButtons.push(
      createEl('button', {
        className: 'btn btn-secondary',
        text: 'Cerrar',
        events: { click: closeModal }
      })
    );
  }

  const footerEl = createEl('footer', { className: 'modal-footer' }, footerButtons);

  const dialogEl = createEl(
    'div',
    {
      className: 'modal-dialog',
      attrs: { role: 'dialog', 'aria-modal': 'true' }
    },
    [headerEl, bodyEl, footerEl]
  );

  const backdropEl = createEl(
    'div',
    {
      className: 'modal-backdrop',
      events: {
        click: (e) => {
          if (e.target === backdropEl) closeModal();
        }
      }
    },
    [dialogEl]
  );

  document.body.appendChild(backdropEl);
  activeBackdrop = backdropEl;

  // Forzar reflujo para activar animación
  requestAnimationFrame(() => {
    backdropEl.classList.add('modal-open');
  });

  // Manejar tecla Escape
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onKeyDown);
    }
  };
  document.addEventListener('keydown', onKeyDown);
};

/**
 * Cierra la ventana modal activa de manera segura.
 */
export const closeModal = () => {
  if (activeBackdrop && activeBackdrop.parentNode) {
    activeBackdrop.classList.remove('modal-open');
    setTimeout(() => {
      if (activeBackdrop && activeBackdrop.parentNode) {
        activeBackdrop.parentNode.removeChild(activeBackdrop);
        activeBackdrop = null;
      }
    }, 200);
  }
};
