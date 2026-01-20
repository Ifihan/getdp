/**
 * DP Generator - Dashboard Script with Interactive Preview
 */

const CONFIG = {
  MAX_FILE_SIZE: 16 * 1024 * 1024,
  MAX_FONT_SIZE: 10 * 1024 * 1024,
  CANVAS_WIDTH: 1024,
  CANVAS_HEIGHT: 1024,
  DUMMY_NAME: 'John Doe',
};

const state = {
  templateId: null,
  fontId: null,
  configSaved: false,
  editingConfigId: null,
  templateImage: null,
  dummyPhotoImage: null,
  customFont: null,
  imageX: 50,
  imageY: 50,
  imageSize: 40,
  imageShape: 'circle',
  textX: 50,
  textY: 75,
  fontSize: 4,
  textColor: '#000000',
  isDraggingPhoto: false,
  isDraggingText: false,
  dragStartX: 0,
  dragStartY: 0,
};

const elements = {
  templateName: document.getElementById('templateName'),
  templateUpload: document.getElementById('templateUpload'),
  templateInput: document.getElementById('templateInput'),
  templateFilename: document.getElementById('templateFilename'),
  fontUpload: document.getElementById('fontUpload'),
  fontInput: document.getElementById('fontInput'),
  fontFilename: document.getElementById('fontFilename'),
  conferenceName: document.getElementById('conferenceName'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  footerText: document.getElementById('footerText'),
  shareMessage: document.getElementById('shareMessage'),
  imageSizeSlider: document.getElementById('imageSize'),
  imageSizeValue: document.getElementById('imageSizeValue'),
  fontSizeSlider: document.getElementById('fontSize'),
  fontSizeValue: document.getElementById('fontSizeValue'),
  textColorInput: document.getElementById('textColor'),
  circleBtn: document.getElementById('circleBtn'),
  rectangleBtn: document.getElementById('rectangleBtn'),
  nameRequiredCheckbox: document.getElementById('nameRequired'),
  canvas: document.getElementById('previewCanvas'),
  photoHandle: document.getElementById('photoHandle'),
  textHandle: document.getElementById('textHandle'),
  photoPositionDisplay: document.getElementById('photoPositionDisplay'),
  textPositionDisplay: document.getElementById('textPositionDisplay'),
  saveConfigBtn: document.getElementById('saveConfigBtn'),
  copyLinkBtn: document.getElementById('copyLinkBtn'),
  shareLink: document.getElementById('shareLink'),
  errorMessage: document.getElementById('errorMessage'),
  alertOverlay: document.getElementById('customAlertOverlay'),
  alertIcon: document.getElementById('customAlertIcon'),
  alertTitle: document.getElementById('customAlertTitle'),
  alertMessage: document.getElementById('customAlertMessage'),
  alertSteps: document.getElementById('customAlertSteps'),
  alertButton: document.getElementById('customAlertButton'),
};

const ctx = elements.canvas.getContext('2d');

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.add('show');
}

function hideError() {
  elements.errorMessage.classList.remove('show');
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
  elements.alertSteps.classList.add('hidden');
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

function initializeCanvas() {
  elements.canvas.width = CONFIG.CANVAS_WIDTH;
  elements.canvas.height = CONFIG.CANVAS_HEIGHT;
}

function drawPreview() {
  ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  if (state.templateImage) {
    ctx.drawImage(state.templateImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  }

  if (state.dummyPhotoImage) {
    const centerX = (state.imageX / 100) * CONFIG.CANVAS_WIDTH;
    const centerY = (state.imageY / 100) * CONFIG.CANVAS_HEIGHT;
    const size = (state.imageSize / 100) * CONFIG.CANVAS_WIDTH;

    ctx.save();

    if (state.imageShape === 'circle') {
      const radius = size * 0.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const imgAspect = state.dummyPhotoImage.width / state.dummyPhotoImage.height;
      const drawSize = radius * 2;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > 1) {
        drawHeight = drawSize;
        drawWidth = drawSize * imgAspect;
        offsetX = centerX - drawWidth / 2;
        offsetY = centerY - drawHeight / 2;
      } else {
        drawWidth = drawSize;
        drawHeight = drawSize / imgAspect;
        offsetX = centerX - drawWidth / 2;
        offsetY = centerY - drawHeight / 2;
      }

      ctx.drawImage(state.dummyPhotoImage, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      const rectX = centerX - size / 2;
      const rectY = centerY - size / 2;

      ctx.beginPath();
      ctx.rect(rectX, rectY, size, size);
      ctx.closePath();
      ctx.clip();

      const imgAspect = state.dummyPhotoImage.width / state.dummyPhotoImage.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > 1) {
        drawHeight = size;
        drawWidth = size * imgAspect;
        offsetX = rectX + (size - drawWidth) / 2;
        offsetY = rectY;
      } else {
        drawWidth = size;
        drawHeight = size / imgAspect;
        offsetX = rectX;
        offsetY = rectY + (size - drawHeight) / 2;
      }

      ctx.drawImage(state.dummyPhotoImage, offsetX, offsetY, drawWidth, drawHeight);
    }

    ctx.restore();
  }

  const textX = (state.textX / 100) * CONFIG.CANVAS_WIDTH;
  const textY = (state.textY / 100) * CONFIG.CANVAS_HEIGHT;
  const fontSize = (state.fontSize / 100) * CONFIG.CANVAS_HEIGHT;

  ctx.font = `${fontSize}px "ClashDisplay", "Arial", sans-serif`;
  ctx.fillStyle = state.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(CONFIG.DUMMY_NAME.toUpperCase(), textX, textY);

  updateHandlePositions();
}

function updateHandlePositions() {
  const container = elements.canvas.parentElement;
  const rect = container.getBoundingClientRect();

  const photoX = (state.imageX / 100) * rect.width;
  const photoY = (state.imageY / 100) * (rect.width * (CONFIG.CANVAS_HEIGHT / CONFIG.CANVAS_WIDTH));
  elements.photoHandle.style.left = `${photoX}px`;
  elements.photoHandle.style.top = `${photoY}px`;
  elements.photoHandle.style.transform = 'translate(-50%, -50%)';

  const textHandleX = (state.textX / 100) * rect.width;
  const textHandleY = (state.textY / 100) * (rect.width * (CONFIG.CANVAS_HEIGHT / CONFIG.CANVAS_WIDTH));
  elements.textHandle.style.left = `${textHandleX}px`;
  elements.textHandle.style.top = `${textHandleY}px`;
  elements.textHandle.style.transform = 'translate(-50%, -50%)';

  elements.photoPositionDisplay.textContent = `${Math.round(state.imageX)}%, ${Math.round(state.imageY)}%`;
  elements.textPositionDisplay.textContent = `${Math.round(state.textX)}%, ${Math.round(state.textY)}%`;
}

function loadDefaultImages() {
  const templateImg = new Image();
  templateImg.crossOrigin = 'anonymous';
  templateImg.onload = () => {
    state.templateImage = templateImg;
    drawPreview();
  };
  templateImg.src = '/static/assets/demo.png';

  createDummyPhoto();
}

function createDummyPhoto() {
  const dummyCanvas = document.createElement('canvas');
  dummyCanvas.width = 800;
  dummyCanvas.height = 800;
  const dummyCtx = dummyCanvas.getContext('2d');

  dummyCtx.fillStyle = '#f5f5f5';
  dummyCtx.fillRect(0, 0, 800, 800);

  dummyCtx.strokeStyle = '#e5e5e5';
  dummyCtx.lineWidth = 40;
  for (let i = -800; i < 1600; i += 100) {
    dummyCtx.beginPath();
    dummyCtx.moveTo(i, 0);
    dummyCtx.lineTo(i + 800, 800);
    dummyCtx.stroke();
  }

  dummyCtx.fillStyle = '#d4d4d4';
  dummyCtx.font = 'bold 80px Arial';
  dummyCtx.textAlign = 'center';
  dummyCtx.textBaseline = 'middle';
  dummyCtx.fillText('SAMPLE', 400, 400);

  const img = new Image();
  img.onload = () => {
    state.dummyPhotoImage = img;
    drawPreview();
  };
  img.src = dummyCanvas.toDataURL();
}

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
    if (type === 'image' && !file.type.startsWith('image/')) {
      showError('Please upload an image file');
      return;
    }

    if (type === 'font' && !file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
      showError('Please upload a valid font file');
      return;
    }

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

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            state.templateImage = img;

            CONFIG.CANVAS_WIDTH = img.width;
            CONFIG.CANVAS_HEIGHT = img.height;
            elements.canvas.width = img.width;
            elements.canvas.height = img.height;

            const container = elements.canvas.parentElement;
            container.style.aspectRatio = `${img.width} / ${img.height}`;

            drawPreview();
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);

      } catch (error) {
        showError(error.message);
        elements.templateUpload.classList.remove('has-file');
        elements.templateFilename.classList.add('hidden');
      }
    },
  }
);

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
        drawPreview();

      } catch (error) {
        showError(error.message);
        elements.fontUpload.classList.remove('has-file');
        elements.fontFilename.classList.add('hidden');
      }
    },
  }
);

elements.imageSizeSlider.addEventListener('input', () => {
  state.imageSize = parseFloat(elements.imageSizeSlider.value);
  elements.imageSizeValue.textContent = state.imageSize + '%';
  drawPreview();
});

elements.fontSizeSlider.addEventListener('input', () => {
  state.fontSize = parseFloat(elements.fontSizeSlider.value);
  elements.fontSizeValue.textContent = state.fontSize + '%';
  drawPreview();
});

elements.textColorInput.addEventListener('input', () => {
  state.textColor = elements.textColorInput.value;
  drawPreview();
});

elements.circleBtn.addEventListener('click', () => {
  state.imageShape = 'circle';
  elements.circleBtn.classList.add('active');
  elements.rectangleBtn.classList.remove('active');
  drawPreview();
});

elements.rectangleBtn.addEventListener('click', () => {
  state.imageShape = 'rectangle';
  elements.rectangleBtn.classList.add('active');
  elements.circleBtn.classList.remove('active');
  drawPreview();
});

function setupDragHandles() {
  elements.photoHandle.addEventListener('mousedown', startDragPhoto);
  elements.photoHandle.addEventListener('touchstart', startDragPhoto);

  elements.textHandle.addEventListener('mousedown', startDragText);
  elements.textHandle.addEventListener('touchstart', startDragText);

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('touchmove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
}

function startDragPhoto(e) {
  e.preventDefault();
  state.isDraggingPhoto = true;
  const pos = getEventPosition(e);
  state.dragStartX = pos.x;
  state.dragStartY = pos.y;
}

function startDragText(e) {
  e.preventDefault();
  state.isDraggingText = true;
  const pos = getEventPosition(e);
  state.dragStartX = pos.x;
  state.dragStartY = pos.y;
}

function handleDrag(e) {
  if (!state.isDraggingPhoto && !state.isDraggingText) return;

  e.preventDefault();
  const pos = getEventPosition(e);
  const container = elements.canvas.parentElement;
  const rect = container.getBoundingClientRect();

  const percentX = ((pos.x - rect.left) / rect.width) * 100;
  const percentY = ((pos.y - rect.top) / (rect.width * (CONFIG.CANVAS_HEIGHT / CONFIG.CANVAS_WIDTH))) * 100;

  if (state.isDraggingPhoto) {
    state.imageX = Math.max(10, Math.min(90, percentX));
    state.imageY = Math.max(10, Math.min(90, percentY));
  }

  if (state.isDraggingText) {
    state.textX = Math.max(10, Math.min(90, percentX));
    state.textY = Math.max(50, Math.min(95, percentY));
  }

  drawPreview();
}

function stopDrag() {
  state.isDraggingPhoto = false;
  state.isDraggingText = false;
}

function getEventPosition(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function getConfiguration() {
  return {
    template_name: elements.templateName.value.trim() || 'Untitled Template',
    template_id: state.templateId,
    font_id: state.fontId,
    conference_name: elements.conferenceName.value.trim() || 'Conference',
    page_subtitle: elements.pageSubtitle.value.trim() || '',
    footer_text: elements.footerText.value.trim() || '',
    share_message: elements.shareMessage.value.trim() || '',
    name_required: elements.nameRequiredCheckbox.checked,
    image_x: Math.round(state.imageX),
    image_y: Math.round(state.imageY),
    image_size: Math.round(state.imageSize),
    image_shape: state.imageShape,
    text_x: Math.round(state.textX),
    text_y: Math.round(state.textY),
    font_size: Math.round(state.fontSize * 10) / 10,
    text_color: state.textColor.replace('#', ''),
    created_at: new Date().toISOString(),
  };
}

async function saveConfiguration() {
  try {
    if (!elements.templateName.value.trim()) {
      showError('Please enter a template name');
      elements.templateName.focus();
      return;
    }

    const config = getConfiguration();

    if (state.editingConfigId) {
      config.config_id = state.editingConfigId;
    }

    const response = await fetch('/api/save-config', {
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

    if (!state.editingConfigId && data.config_id) {
      state.editingConfigId = data.config_id;
      const newUrl = `${window.location.pathname}?edit=${data.config_id}`;
      window.history.replaceState({}, '', newUrl);
    }

    const baseUrl = window.location.origin;
    const configId = state.editingConfigId || data.config_id;
    const shareUrl = configId ? `${baseUrl}/generate-dp?config=${configId}` : `${baseUrl}/generate-dp`;
    elements.shareLink.value = shareUrl;

    showCustomAlert({
      type: 'success',
      title: state.editingConfigId ? 'Template Updated' : 'Template Saved',
      message: state.editingConfigId
        ? 'Your template has been updated successfully.'
        : 'Your template has been saved. Share the link below with users or view it in Generated Templates.',
    });

    return data;
  } catch (error) {
    showError(error.message);
    throw error;
  }
}

async function loadConfiguration() {
  try {
    const response = await fetch('/api/get-config');

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.config) {
      const config = data.config;

      if (config.template_name) {
        elements.templateName.value = config.template_name;
      }
      if (config.image_x !== undefined) state.imageX = parseFloat(config.image_x);
      if (config.image_y !== undefined) state.imageY = parseFloat(config.image_y);
      if (config.image_size !== undefined) {
        state.imageSize = parseFloat(config.image_size);
        elements.imageSizeSlider.value = state.imageSize;
        elements.imageSizeValue.textContent = state.imageSize + '%';
      }
      if (config.image_shape) {
        state.imageShape = config.image_shape;
        if (config.image_shape === 'circle') {
          elements.circleBtn.classList.add('active');
          elements.rectangleBtn.classList.remove('active');
        } else {
          elements.rectangleBtn.classList.add('active');
          elements.circleBtn.classList.remove('active');
        }
      }
      if (config.text_x !== undefined) state.textX = parseFloat(config.text_x);
      if (config.text_y !== undefined) state.textY = parseFloat(config.text_y);
      if (config.font_size !== undefined) {
        state.fontSize = parseFloat(config.font_size);
        elements.fontSizeSlider.value = state.fontSize;
        elements.fontSizeValue.textContent = state.fontSize + '%';
      }
      if (config.text_color) {
        state.textColor = '#' + config.text_color;
        elements.textColorInput.value = state.textColor;
      }

      if (config.template_id) state.templateId = config.template_id;
      if (config.font_id) state.fontId = config.font_id;

      if (config.conference_name) {
        elements.conferenceName.value = config.conference_name;
      }
      if (config.page_subtitle) {
        elements.pageSubtitle.value = config.page_subtitle;
      }
      if (config.footer_text) {
        elements.footerText.value = config.footer_text;
      }
      if (config.share_message) {
        elements.shareMessage.value = config.share_message;
      }

      if (config.name_required !== undefined) {
        elements.nameRequiredCheckbox.checked = config.name_required;
      }

      if (data.config_id) {
        const baseUrl = window.location.origin;
        elements.shareLink.value = `${baseUrl}/generate-dp?config=${data.config_id}`;
      }

      drawPreview();
      return config;
    }

    return null;
  } catch (error) {
    return null;
  }
}

elements.saveConfigBtn.addEventListener('click', saveConfiguration);

elements.copyLinkBtn.addEventListener('click', async () => {
  const link = elements.shareLink.value;

  if (!link) {
    showError('Please save template first');
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
    elements.shareLink.select();
    document.execCommand('copy');
    showCustomAlert({
      type: 'success',
      title: 'Link Copied',
      message: 'The share link has been copied to your clipboard.',
    });
  }
});

window.addEventListener('resize', () => {
  if (state.templateImage || state.dummyPhotoImage) {
    drawPreview();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  elements.shareLink.value = `${window.location.origin}/generate-dp`;

  initializeCanvas();
  loadDefaultImages();
  setupDragHandles();

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId) {
    loadConfigurationById(editId);
  }
});

async function loadConfigurationById(configId) {
  try {
    const response = await fetch(`/api/get-config?config_id=${configId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.config) {
      const config = data.config;

      state.editingConfigId = configId;

      if (config.template_name) {
        elements.templateName.value = config.template_name;
      }
      if (config.image_x !== undefined) state.imageX = parseFloat(config.image_x);
      if (config.image_y !== undefined) state.imageY = parseFloat(config.image_y);
      if (config.image_size !== undefined) {
        state.imageSize = parseFloat(config.image_size);
        elements.imageSizeSlider.value = state.imageSize;
        elements.imageSizeValue.textContent = state.imageSize + '%';
      }
      if (config.image_shape) {
        state.imageShape = config.image_shape;
        if (config.image_shape === 'circle') {
          elements.circleBtn.classList.add('active');
          elements.rectangleBtn.classList.remove('active');
        } else {
          elements.rectangleBtn.classList.add('active');
          elements.circleBtn.classList.remove('active');
        }
      }
      if (config.text_x !== undefined) state.textX = parseFloat(config.text_x);
      if (config.text_y !== undefined) state.textY = parseFloat(config.text_y);
      if (config.font_size !== undefined) {
        state.fontSize = parseFloat(config.font_size);
        elements.fontSizeSlider.value = state.fontSize;
        elements.fontSizeValue.textContent = state.fontSize + '%';
      }
      if (config.text_color) {
        state.textColor = '#' + config.text_color;
        elements.textColorInput.value = state.textColor;
      }

      if (config.template_id) {
        state.templateId = config.template_id;
        loadTemplateImage(config.template_id);
        elements.templateUpload.classList.add('has-file');
        elements.templateFilename.textContent = 'Template loaded';
        elements.templateFilename.classList.remove('hidden');
      }
      if (config.font_id) state.fontId = config.font_id;

      if (config.conference_name) {
        elements.conferenceName.value = config.conference_name;
      }
      if (config.page_subtitle) {
        elements.pageSubtitle.value = config.page_subtitle;
      }
      if (config.footer_text) {
        elements.footerText.value = config.footer_text;
      }
      if (config.share_message) {
        elements.shareMessage.value = config.share_message;
      }

      if (config.name_required !== undefined) {
        elements.nameRequiredCheckbox.checked = config.name_required;
      }

      const baseUrl = window.location.origin;
      elements.shareLink.value = `${baseUrl}/generate-dp?config=${configId}`;

      drawPreview();
      return config;
    }

    return null;
  } catch (error) {
    return null;
  }
}

function loadTemplateImage(templateId) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.templateImage = img;

    CONFIG.CANVAS_WIDTH = img.width;
    CONFIG.CANVAS_HEIGHT = img.height;
    elements.canvas.width = img.width;
    elements.canvas.height = img.height;

    const container = elements.canvas.parentElement;
    container.style.aspectRatio = `${img.width} / ${img.height}`;

    drawPreview();
  };
  img.onerror = () => {
    // Failed to load template image, using default
  };
  img.src = `/api/uploads/templates/${templateId}`;
}
