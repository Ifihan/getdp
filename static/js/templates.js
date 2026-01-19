/**
 * DP Generator - Templates Page Script
 */

const state = {
  templates: [],
  filteredTemplates: [],
  selectedTemplate: null,
  deleteTargetId: null,
};

const elements = {
  templatesGrid: document.getElementById('templatesGrid'),
  emptyState: document.getElementById('emptyState'),
  templatesLoading: document.getElementById('templatesLoading'),
  templatesCount: document.getElementById('countNumber'),
  searchInput: document.getElementById('searchInput'),
  templateModal: document.getElementById('templateModal'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.getElementById('modalTitle'),
  modalDate: document.getElementById('modalDate'),
  modalPreview: document.getElementById('modalPreview'),
  modalConfig: document.getElementById('modalConfig'),
  modalLink: document.getElementById('modalLink'),
  modalCopyBtn: document.getElementById('modalCopyBtn'),
  modalEditBtn: document.getElementById('modalEditBtn'),
  modalDeleteBtn: document.getElementById('modalDeleteBtn'),
  deleteModal: document.getElementById('deleteModal'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  alertOverlay: document.getElementById('customAlertOverlay'),
  alertIcon: document.getElementById('customAlertIcon'),
  alertTitle: document.getElementById('customAlertTitle'),
  alertMessage: document.getElementById('customAlertMessage'),
  alertButton: document.getElementById('customAlertButton'),
};

function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString) {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showCustomAlert(options) {
  const { type, title, message, onClose } = options;

  if (type === 'success') {
    elements.alertIcon.innerHTML = '&#10003;';
    elements.alertIcon.className = 'custom-alert-icon success-checkmark';
  } else {
    elements.alertIcon.innerHTML = 'i';
    elements.alertIcon.className = 'custom-alert-icon info-icon';
  }

  elements.alertTitle.textContent = title || 'Notification';
  elements.alertMessage.textContent = message || '';
  elements.alertOverlay.classList.add('show');

  const closeHandler = () => {
    elements.alertOverlay.classList.remove('show');
    if (onClose) onClose();
  };

  elements.alertButton.onclick = closeHandler;
  elements.alertOverlay.onclick = (e) => {
    if (e.target === elements.alertOverlay) closeHandler();
  };
}

function getTemplateLink(configId) {
  return `${window.location.origin}/generate-dp?config=${configId}`;
}

function createTemplateCard(template, configId) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.dataset.configId = configId;

  const conferenceName = template.conference_name || 'Untitled';
  const templateName = template.template_name || conferenceName;
  const createdAt = formatDate(template.created_at);
  const imageShape = template.image_shape || 'circle';
  const fontSize = template.font_size || '4';

  card.innerHTML = `
    <div class="template-card-preview">
      <span class="preview-placeholder">Preview</span>
    </div>
    <div class="template-card-body">
      <h3 class="template-card-title">${escapeHtml(templateName)}</h3>
      <div class="template-card-meta">
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${createdAt}
        </span>
      </div>
      <div class="template-card-config">
        <span class="config-tag">${imageShape}</span>
        <span class="config-tag">Font: ${fontSize}%</span>
        ${template.text_color ? `<span class="config-tag">#${template.text_color}</span>` : ''}
      </div>
      <div class="template-card-actions">
        <button type="button" class="btn-copy" data-config-id="${configId}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy Link
        </button>
        <button type="button" class="btn-view" data-config-id="${configId}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
    </div>
  `;

  const copyBtn = card.querySelector('.btn-copy');
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyTemplateLink(configId);
  });

  const viewBtn = card.querySelector('.btn-view');
  viewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openTemplateModal(configId);
  });

  card.addEventListener('click', () => {
    openTemplateModal(configId);
  });

  return card;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadTemplates() {
  elements.templatesLoading.classList.add('show');
  elements.templatesGrid.innerHTML = '';
  elements.emptyState.classList.remove('show');

  try {
    const response = await fetch('/api/list-configs');

    if (!response.ok) {
      throw new Error('Failed to load templates');
    }

    const data = await response.json();
    state.templates = data.configs || {};
    state.filteredTemplates = Object.entries(state.templates);

    renderTemplates();
  } catch (error) {
    console.error('Error loading templates:', error);
    elements.emptyState.classList.add('show');
  } finally {
    elements.templatesLoading.classList.remove('show');
  }
}

function renderTemplates() {
  elements.templatesGrid.innerHTML = '';

  const templates = state.filteredTemplates;
  elements.templatesCount.textContent = templates.length;

  if (templates.length === 0) {
    elements.emptyState.classList.add('show');
    return;
  }

  elements.emptyState.classList.remove('show');

  templates.sort((a, b) => {
    const dateA = new Date(a[1].created_at || 0);
    const dateB = new Date(b[1].created_at || 0);
    return dateB - dateA;
  });

  templates.forEach(([configId, template]) => {
    const card = createTemplateCard(template, configId);
    elements.templatesGrid.appendChild(card);
  });
}

function filterTemplates(query) {
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    state.filteredTemplates = Object.entries(state.templates);
  } else {
    state.filteredTemplates = Object.entries(state.templates).filter(([configId, template]) => {
      const templateName = (template.template_name || '').toLowerCase();
      const conferenceName = (template.conference_name || '').toLowerCase();
      return templateName.includes(searchTerm) || conferenceName.includes(searchTerm);
    });
  }

  renderTemplates();
}

async function copyTemplateLink(configId) {
  const link = getTemplateLink(configId);

  try {
    await navigator.clipboard.writeText(link);
    showCustomAlert({
      type: 'success',
      title: 'Link Copied',
      message: 'The template link has been copied to your clipboard.',
    });
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = link;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showCustomAlert({
      type: 'success',
      title: 'Link Copied',
      message: 'The template link has been copied to your clipboard.',
    });
  }
}

function openTemplateModal(configId) {
  const template = state.templates[configId];
  if (!template) return;

  state.selectedTemplate = { id: configId, ...template };

  elements.modalTitle.textContent = template.template_name || template.conference_name || 'Untitled Template';
  elements.modalDate.textContent = `Created: ${formatDateTime(template.created_at)}`;
  elements.modalLink.value = getTemplateLink(configId);

  if (template.template_id) {
    elements.modalPreview.src = `/api/uploads/templates/${template.template_id}`;
    elements.modalPreview.style.display = 'block';
  } else {
    elements.modalPreview.src = '/static/assets/demo.png';
    elements.modalPreview.style.display = 'block';
  }

  elements.modalConfig.innerHTML = `
    <div class="config-item">
      <div class="config-item-label">Event Name</div>
      <div class="config-item-value">${escapeHtml(template.conference_name || 'Not set')}</div>
    </div>
    <div class="config-item">
      <div class="config-item-label">Name Required</div>
      <div class="config-item-value">${template.name_required !== false ? 'Yes' : 'No'}</div>
    </div>
    <div class="config-item">
      <div class="config-item-label">Photo Shape</div>
      <div class="config-item-value">${template.image_shape || 'circle'}</div>
    </div>
    <div class="config-item">
      <div class="config-item-label">Photo Size</div>
      <div class="config-item-value">${template.image_size || '40'}%</div>
    </div>
    <div class="config-item">
      <div class="config-item-label">Photo Position</div>
      <div class="config-item-value">${template.image_x || '50'}%, ${template.image_y || '50'}%</div>
    </div>
    <div class="config-item">
      <div class="config-item-label">Font Size</div>
      <div class="config-item-value">${template.font_size || '4'}%</div>
    </div>
    <div class="config-item">
      <div class="config-item-label">Text Color</div>
      <div class="config-item-value">#${template.text_color || '000000'}</div>
    </div>
  `;

  elements.templateModal.classList.add('show');
}

function closeTemplateModal() {
  elements.templateModal.classList.remove('show');
  state.selectedTemplate = null;
}

function openDeleteModal() {
  if (!state.selectedTemplate) return;
  state.deleteTargetId = state.selectedTemplate.id;
  elements.deleteModal.classList.add('show');
}

function closeDeleteModal() {
  elements.deleteModal.classList.remove('show');
  state.deleteTargetId = null;
}

async function deleteTemplate() {
  if (!state.deleteTargetId) return;

  try {
    const response = await fetch(`/api/delete-config?config_id=${state.deleteTargetId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete template');
    }

    delete state.templates[state.deleteTargetId];
    state.filteredTemplates = Object.entries(state.templates);

    closeDeleteModal();
    closeTemplateModal();
    renderTemplates();

    showCustomAlert({
      type: 'success',
      title: 'Template Deleted',
      message: 'The template has been successfully deleted.',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    showCustomAlert({
      type: 'error',
      title: 'Error',
      message: 'Failed to delete the template. Please try again.',
    });
  }
}

function editTemplate() {
  if (!state.selectedTemplate) return;
  window.location.href = `/?edit=${state.selectedTemplate.id}`;
}

function setupEventListeners() {
  elements.searchInput.addEventListener('input', (e) => {
    filterTemplates(e.target.value);
  });

  elements.modalClose.addEventListener('click', closeTemplateModal);
  elements.templateModal.addEventListener('click', (e) => {
    if (e.target === elements.templateModal) closeTemplateModal();
  });

  elements.modalCopyBtn.addEventListener('click', () => {
    if (state.selectedTemplate) {
      copyTemplateLink(state.selectedTemplate.id);
    }
  });

  elements.modalEditBtn.addEventListener('click', editTemplate);
  elements.modalDeleteBtn.addEventListener('click', openDeleteModal);

  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', deleteTemplate);
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.deleteModal.classList.contains('show')) {
        closeDeleteModal();
      } else if (elements.templateModal.classList.contains('show')) {
        closeTemplateModal();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadTemplates();
});
