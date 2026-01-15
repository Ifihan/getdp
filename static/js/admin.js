/**
 * DP Generator - Admin Panel Script
 * Handles template/font uploads and position configuration
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_FONT_SIZE: 10 * 1024 * 1024, // 10MB
};

// ============================================
// STATE
// ============================================
const state = {
  templateId: null,
  fontId: null,
  configSaved: false,
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  // Upload areas
  templateUpload: document.getElementById('templateUpload'),
  templateInput: document.getElementById('templateInput'),
  templateFilename: document.getElementById('templateFilename'),

  fontUpload: document.getElementById('fontUpload'),
  fontInput: document.getElementById('fontInput'),
  fontFilename: document.getElementById('fontFilename'),

  // Position sliders
  imageXSlider: document.getElementById('imageX'),
  imageXValue: document.getElementById('imageXValue'),
  imageYSlider: document.getElementById('imageY'),
  imageYValue: document.getElementById('imageYValue'),
  imageSizeSlider: document.getElementById('imageSize'),
  imageSizeValue: document.getElementById('imageSizeValue'),
  textYSlider: document.getElementById('textY'),
  textYValue: document.getElementById('textYValue'),
  fontSizeSlider: document.getElementById('fontSize'),
  fontSizeValue: document.getElementById('fontSizeValue'),
  textColorInput: document.getElementById('textColor'),

  // Preview
  previewImage: document.getElementById('previewImage'),

  // Buttons
  saveConfigBtn: document.getElementById('saveConfigBtn'),
  copyLinkBtn: document.getElementById('copyLinkBtn'),

  // Share link
  shareLinkBox: document.getElementById('shareLinkBox'),
  shareLink: document.getElementById('shareLink'),

  // UI elements
  errorMessage: document.getElementById('errorMessage'),

  // Alert dialog
  alertOverlay: document.getElementById('customAlertOverlay'),
  alertIcon: document.getElementById('customAlertIcon'),
  alertTitle: document.getElementById('customAlertTitle'),
  alertMessage: document.getElementById('customAlertMessage'),
  alertSteps: document.getElementById('customAlertSteps'),
  alertButton: document.getElementById('customAlertButton'),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.add('show');
}

function hideError() {
  elements.errorMessage.classList.remove('show');
}

function showCustomAlert(options) {
  const { type, title, message, steps, onClose } = options;

  if (type === 'success') {
    elements.alertIcon.innerHTML = '&#10003;';
    elements.alertIcon.className = 'custom-alert-icon success-checkmark';
  } else {
    elements.alertIcon.innerHTML = 'i';
    elements.alertIcon.className = 'custom-alert-icon info-icon';
  }

  elements.alertTitle.textContent = title || 'Notification';
  elements.alertMessage.textContent = message || '';

  if (steps && steps.length > 0) {
    elements.alertSteps.classList.remove('hidden');
    elements.alertSteps.innerHTML = steps.map((step, i) => `
      <div class="custom-alert-step">
        <div class="custom-alert-step-number">${i + 1}</div>
        <div class="custom-alert-step-text">${step}</div>
      </div>
    `).join('');
  } else {
    elements.alertSteps.classList.add('hidden');
  }

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

// ============================================
// FILE UPLOAD HANDLERS
// ============================================
function setupUploadArea(uploadArea, inputElement, filenameElement, options) {
  const { onFile, maxSize, type } = options;

  uploadArea.addEventListener('click', () => inputElement.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  inputElement.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    // Validate file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      showError('Please upload an image file');
      return;
    }

    if (type === 'font' && !file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
      showError('Please upload a valid font file (.ttf, .otf, .woff, .woff2)');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      showError(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    hideError();
    uploadArea.classList.add('has-file');
    filenameElement.textContent = file.name;
    filenameElement.classList.remove('hidden');

    if (onFile) onFile(file);
  }
}

// Template upload
setupUploadArea(
  elements.templateUpload,
  elements.templateInput,
  elements.templateFilename,
  {
    type: 'image',
    maxSize: CONFIG.MAX_FILE_SIZE,
    onFile: async (file) => {
      try {
        const formData = new FormData();
        formData.append('template', file);

        const response = await fetch('/api/upload-template', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload template');
        }

        state.templateId = data.template_id;

        // Update preview
        const reader = new FileReader();
        reader.onload = (e) => {
          elements.previewImage.src = e.target.result;
        };
        reader.readAsDataURL(file);

        console.log('Template uploaded:', state.templateId);
      } catch (error) {
        showError(error.message);
        elements.templateUpload.classList.remove('has-file');
        elements.templateFilename.classList.add('hidden');
      }
    },
  }
);

// Font upload
setupUploadArea(
  elements.fontUpload,
  elements.fontInput,
  elements.fontFilename,
  {
    type: 'font',
    maxSize: CONFIG.MAX_FONT_SIZE,
    onFile: async (file) => {
      try {
        const formData = new FormData();
        formData.append('font', file);

        const response = await fetch('/api/upload-font', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload font');
        }

        state.fontId = data.font_id;
        console.log('Font uploaded:', state.fontId);
      } catch (error) {
        showError(error.message);
        elements.fontUpload.classList.remove('has-file');
        elements.fontFilename.classList.add('hidden');
      }
    },
  }
);

// ============================================
// SLIDER HANDLERS
// ============================================
function setupSlider(slider, valueElement, suffix = '%') {
  slider.addEventListener('input', () => {
    valueElement.textContent = slider.value + suffix;
  });
}

setupSlider(elements.imageXSlider, elements.imageXValue);
setupSlider(elements.imageYSlider, elements.imageYValue);
setupSlider(elements.imageSizeSlider, elements.imageSizeValue);
setupSlider(elements.textYSlider, elements.textYValue);
setupSlider(elements.fontSizeSlider, elements.fontSizeValue);

// ============================================
// CONFIGURATION MANAGEMENT
// ============================================
function getConfiguration() {
  return {
    template_id: state.templateId,
    font_id: state.fontId,
    image_x: elements.imageXSlider.value,
    image_y: elements.imageYSlider.value,
    image_size: elements.imageSizeSlider.value,
    text_y: elements.textYSlider.value,
    font_size: elements.fontSizeSlider.value,
    text_color: elements.textColorInput.value.replace('#', ''),
  };
}

async function saveConfiguration() {
  try {
    const config = getConfiguration();

    const response = await fetch('/admin/api/save-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save configuration');
    }

    state.configSaved = true;

    // Update share link
    const baseUrl = window.location.origin;
    const shareUrl = data.config_id ? `${baseUrl}/?config=${data.config_id}` : baseUrl;
    elements.shareLink.value = shareUrl;

    showCustomAlert({
      type: 'success',
      title: 'Configuration Saved',
      message: 'Your settings have been saved. Share the link below with users.',
    });

    return data;
  } catch (error) {
    showError(error.message);
    throw error;
  }
}

async function loadConfiguration() {
  try {
    const response = await fetch('/admin/api/get-config');

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.config) {
      const config = data.config;

      // Apply configuration to UI
      if (config.image_x) {
        elements.imageXSlider.value = config.image_x;
        elements.imageXValue.textContent = config.image_x + '%';
      }
      if (config.image_y) {
        elements.imageYSlider.value = config.image_y;
        elements.imageYValue.textContent = config.image_y + '%';
      }
      if (config.image_size) {
        elements.imageSizeSlider.value = config.image_size;
        elements.imageSizeValue.textContent = config.image_size + '%';
      }
      if (config.text_y) {
        elements.textYSlider.value = config.text_y;
        elements.textYValue.textContent = config.text_y + '%';
      }
      if (config.font_size) {
        elements.fontSizeSlider.value = config.font_size;
        elements.fontSizeValue.textContent = config.font_size + '%';
      }
      if (config.text_color) {
        elements.textColorInput.value = '#' + config.text_color;
      }

      // Set template and font IDs
      if (config.template_id) {
        state.templateId = config.template_id;
      }
      if (config.font_id) {
        state.fontId = config.font_id;
      }

      // Update share link
      if (data.config_id) {
        const baseUrl = window.location.origin;
        elements.shareLink.value = `${baseUrl}/?config=${data.config_id}`;
      }

      return config;
    }

    return null;
  } catch (error) {
    console.log('No existing configuration found');
    return null;
  }
}

// ============================================
// EVENT HANDLERS
// ============================================
elements.saveConfigBtn.addEventListener('click', saveConfiguration);

elements.copyLinkBtn.addEventListener('click', async () => {
  const link = elements.shareLink.value;

  if (!link) {
    showError('Please save configuration first');
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    showCustomAlert({
      type: 'success',
      title: 'Link Copied',
      message: 'The share link has been copied to your clipboard.',
    });
  } catch (err) {
    // Fallback for older browsers
    elements.shareLink.select();
    document.execCommand('copy');
    showCustomAlert({
      type: 'success',
      title: 'Link Copied',
      message: 'The share link has been copied to your clipboard.',
    });
  }
});

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Set initial share link
  elements.shareLink.value = window.location.origin;

  // Load existing configuration if any
  loadConfiguration();
});