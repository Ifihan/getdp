/**
 * DP Generator - User Application Script
 * Simple interface for users to upload photo and enter name
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  SHARE_TEXT: "I'm excited to announce that I will be attending the 5th International Conference on AI and Robotics happening on Nov 4-6 at UNILAG.\n\nRegister today: https://icair.unilag.edu.ng/\n\n#icair2025",
  SHARE_URL: "https://icair.unilag.edu.ng/",
  MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
};

// ============================================
// STATE
// ============================================
const state = {
  selectedImage: null,
  processedImageData: null,
  adminConfig: null,
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  // Form inputs
  usernameInput: document.getElementById('usernameInput'),

  // File upload
  photoUpload: document.getElementById('photoUpload'),
  photoInput: document.getElementById('photoInput'),
  photoFilename: document.getElementById('photoFilename'),

  // UI elements
  mainForm: document.getElementById('mainForm'),
  generateBtn: document.getElementById('generateBtn'),
  loading: document.getElementById('loading'),
  errorMessage: document.getElementById('errorMessage'),
  previewContainer: document.getElementById('previewContainer'),
  previewImage: document.getElementById('previewImage'),
  downloadBtn: document.getElementById('downloadBtn'),
  resetBtn: document.getElementById('resetBtn'),

  // Page elements
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  footerText: document.getElementById('footerText'),

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
function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.add('show');
}

function hideError() {
  elements.errorMessage.classList.remove('show');
}

function showLoading() {
  elements.loading.classList.add('show');
  elements.generateBtn.disabled = true;
}

function hideLoading() {
  elements.loading.classList.remove('show');
  elements.generateBtn.disabled = false;
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

function getConfigIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('config');
}

// ============================================
// FILE UPLOAD HANDLER
// ============================================
function setupPhotoUpload() {
  const uploadArea = elements.photoUpload;
  const inputElement = elements.photoInput;
  const filenameElement = elements.photoFilename;

  uploadArea.addEventListener('click', () => inputElement.click());

  // Keyboard accessibility
  uploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputElement.click();
    }
  });

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
    if (!file.type.startsWith('image/') && !file.name.match(/\.heic$/i)) {
      showError('Please upload an image file');
      return;
    }

    // Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      showError(`File too large. Maximum size: ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    hideError();
    uploadArea.classList.add('has-file');
    filenameElement.textContent = file.name;
    filenameElement.classList.remove('hidden');
    state.selectedImage = file;
  }
}

// ============================================
// IMAGE PROCESSING
// ============================================
async function generateDP() {
  const username = elements.usernameInput.value.trim();

  if (!username) {
    showError('Please enter your name');
    elements.usernameInput.focus();
    return;
  }

  if (!state.selectedImage) {
    showError('Please upload a photo');
    return;
  }

  hideError();
  showLoading();

  try {
    const formData = new FormData();
    formData.append('image', state.selectedImage);
    formData.append('username', username);

    // Add admin config parameters if available
    if (state.adminConfig) {
      if (state.adminConfig.template_id) {
        formData.append('template_id', state.adminConfig.template_id);
      }
      if (state.adminConfig.font_id) {
        formData.append('font_id', state.adminConfig.font_id);
      }
      if (state.adminConfig.image_x) {
        formData.append('image_x', state.adminConfig.image_x);
      }
      if (state.adminConfig.image_y) {
        formData.append('image_y', state.adminConfig.image_y);
      }
      if (state.adminConfig.image_size) {
        formData.append('image_size', state.adminConfig.image_size);
      }
      if (state.adminConfig.text_y) {
        formData.append('text_y', state.adminConfig.text_y);
      }
      if (state.adminConfig.font_size) {
        formData.append('font_size', state.adminConfig.font_size);
      }
      if (state.adminConfig.text_color) {
        formData.append('text_color', state.adminConfig.text_color);
      }
    }

    const response = await fetch('/api/process-image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process image');
    }

    state.processedImageData = data.image;
    elements.previewImage.src = data.image;

    hideLoading();
    elements.mainForm.classList.add('hidden');
    elements.previewContainer.classList.add('show');

    // Update page title
    document.getElementById('pageTitle').textContent = 'Your DP is Ready!';
    document.getElementById('pageSubtitle').textContent = 'Download and share your profile picture';

  } catch (error) {
    console.error('Processing error:', error);
    hideLoading();
    showError(error.message);
  }
}

// ============================================
// DOWNLOAD & RESET
// ============================================
function downloadImage() {
  const link = document.createElement('a');
  link.href = elements.previewImage.src;
  link.download = 'icair-2025-dp.png';
  link.click();
}

function resetForm() {
  // Reset state
  state.selectedImage = null;
  state.processedImageData = null;

  // Reset form
  elements.usernameInput.value = '';
  elements.photoInput.value = '';
  elements.photoUpload.classList.remove('has-file');
  elements.photoFilename.classList.add('hidden');

  // Show form, hide preview
  elements.mainForm.classList.remove('hidden');
  elements.previewContainer.classList.remove('show');

  // Reset page title - use conference name from config or default
  const conferenceName = state.adminConfig?.conference_name || 'ICAIR 2025';
  const subtitle = state.adminConfig?.page_subtitle || 'Generate your conference profile picture';
  elements.pageTitle.textContent = conferenceName;
  elements.pageSubtitle.textContent = subtitle;

  hideError();
}

// ============================================
// SOCIAL SHARING
// ============================================
async function getImageBlob() {
  try {
    const response = await fetch(elements.previewImage.src);
    return await response.blob();
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

async function tryWebShareMobile() {
  if (!isMobile() || !navigator.share || !navigator.canShare) {
    return false;
  }

  try {
    const blob = await getImageBlob();
    if (!blob) return false;

    const file = new File([blob], 'icair-2025-dp.png', { type: 'image/png' });
    const shareData = {
      title: 'ICAIR 2025',
      text: CONFIG.SHARE_TEXT,
      files: [file],
    };

    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.log('Web Share API error:', error);
    }
    return error.name === 'AbortError';
  }

  return false;
}

async function shareToTwitter() {
  if (await tryWebShareMobile()) return;

  downloadImage();
  await new Promise(resolve => setTimeout(resolve, 500));

  let clipboardSuccess = false;
  try {
    await navigator.clipboard.writeText(CONFIG.SHARE_TEXT);
    clipboardSuccess = true;
  } catch (err) {
    console.log('Clipboard error:', err);
  }

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(CONFIG.SHARE_TEXT)}`;

  showCustomAlert({
    type: 'success',
    title: 'Ready to Share!',
    message: clipboardSuccess ? 'Image downloaded and caption copied!' : 'Image downloaded.',
    steps: [
      isMobile() ? 'Attach the downloaded image to your tweet' : 'Twitter will open in a new tab',
      'Click the image icon to attach your photo',
      clipboardSuccess ? 'Paste the caption (already copied!)' : 'Add the caption',
      'Tweet!',
    ],
    onClose: () => {
      if (isMobile()) {
        window.location.href = `twitter://post?message=${encodeURIComponent(CONFIG.SHARE_TEXT)}`;
        setTimeout(() => window.open(tweetUrl, '_blank'), 500);
      } else {
        window.open(tweetUrl, '_blank', 'width=550,height=420');
      }
    },
  });
}

async function shareToLinkedIn() {
  if (await tryWebShareMobile()) return;

  downloadImage();
  await new Promise(resolve => setTimeout(resolve, 500));

  let clipboardSuccess = false;
  try {
    await navigator.clipboard.writeText(CONFIG.SHARE_TEXT);
    clipboardSuccess = true;
  } catch (err) {
    console.log('Clipboard error:', err);
  }

  showCustomAlert({
    type: 'success',
    title: 'Ready to Share!',
    message: clipboardSuccess ? 'Image downloaded and caption copied!' : 'Image downloaded.',
    steps: [
      isMobile() ? 'Open LinkedIn app' : 'LinkedIn will open in a new tab',
      'Create a new post',
      'Attach your downloaded image',
      clipboardSuccess ? 'Paste the caption' : 'Add the caption',
      'Post!',
    ],
    onClose: () => {
      if (isMobile()) {
        window.location.href = 'linkedin://';
        setTimeout(() => window.open('https://www.linkedin.com/', '_blank'), 500);
      } else {
        window.open('https://www.linkedin.com/', '_blank');
      }
    },
  });
}

async function shareToInstagram() {
  if (!isMobile()) {
    showCustomAlert({
      type: 'info',
      title: 'Instagram on Mobile',
      message: 'Instagram posting is only available on mobile devices.',
      steps: [
        'Transfer your image to your phone',
        'Open Instagram mobile app',
        'Create a new post',
        'Use the caption from this page',
      ],
    });
    return;
  }

  if (await tryWebShareMobile()) return;

  downloadImage();
  await new Promise(resolve => setTimeout(resolve, 500));

  let clipboardSuccess = false;
  try {
    await navigator.clipboard.writeText(CONFIG.SHARE_TEXT);
    clipboardSuccess = true;
  } catch (err) {
    console.log('Clipboard error:', err);
  }

  showCustomAlert({
    type: 'success',
    title: 'Ready to Share!',
    message: clipboardSuccess ? 'Image downloaded and caption copied!' : 'Image downloaded.',
    steps: [
      'Tap "+" to create a new post',
      'Select your downloaded image',
      clipboardSuccess ? 'Paste the caption' : 'Add the caption',
      'Share!',
    ],
    onClose: () => {
      window.location.href = 'instagram://';
      setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 500);
    },
  });
}

// ============================================
// LOAD ADMIN CONFIG
// ============================================
async function loadAdminConfig() {
  const configId = getConfigIdFromUrl();

  try {
    const url = configId
      ? `/api/get-config?config_id=${configId}`
      : '/api/get-config';

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      if (data.config) {
        state.adminConfig = data.config;

        // Apply conference name to page title
        if (data.config.conference_name) {
          elements.pageTitle.textContent = data.config.conference_name;
          document.title = `${data.config.conference_name} - Get Your DP`;
        }

        // Apply page subtitle
        if (data.config.page_subtitle) {
          elements.pageSubtitle.textContent = data.config.page_subtitle;
        }

        // Apply footer text
        if (data.config.footer_text) {
          elements.footerText.textContent = data.config.footer_text;
        }

        // Update share message if provided
        if (data.config.share_message) {
          CONFIG.SHARE_TEXT = data.config.share_message;
        }

        console.log('Loaded admin config');
      }
    }
  } catch (error) {
    console.log('Using default configuration');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
elements.generateBtn.addEventListener('click', generateDP);
elements.downloadBtn.addEventListener('click', downloadImage);
elements.resetBtn.addEventListener('click', resetForm);

document.getElementById('shareTwitter').addEventListener('click', shareToTwitter);
document.getElementById('shareLinkedIn').addEventListener('click', shareToLinkedIn);
document.getElementById('shareInstagram').addEventListener('click', shareToInstagram);

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  setupPhotoUpload();
  loadAdminConfig();
});