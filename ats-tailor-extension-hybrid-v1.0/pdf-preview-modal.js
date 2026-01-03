// pdf-preview-modal.js - Full PDF Preview Modal with PDF.js
// Features: Zoom, Scroll, Copy, Download, Edit & Retailor

(function(global) {
  'use strict';

  const PDFPreviewModal = {
    // ============ STATE ============
    isOpen: false,
    currentPDF: null,
    currentPage: 1,
    totalPages: 1,
    zoom: 100,
    zoomLevels: [50, 75, 100, 125, 150],

    // ============ SHOW PREVIEW MODAL ============
    show(options) {
      const {
        pdfBase64,
        pdfBlob,
        fileName = 'Tailored_CV.pdf',
        cvText = '',
        score = 0,
        onDownload,
        onEdit,
        onDiscard,
        onCopy
      } = options;

      this.currentPDF = { pdfBase64, pdfBlob, fileName, cvText, score };
      this.callbacks = { onDownload, onEdit, onDiscard, onCopy };

      // Create modal if not exists
      this.createModal();
      
      // Populate content
      this.updateModalContent();
      
      // Show modal
      const modal = document.getElementById('cvTailorProPreviewModal');
      if (modal) {
        modal.classList.add('visible');
        this.isOpen = true;
        
        // Add keyboard listeners
        document.addEventListener('keydown', this.handleKeydown.bind(this));
      }

      console.log('[PDFPreviewModal] Opened with score:', score);
    },

    // ============ CREATE MODAL DOM ============
    createModal() {
      if (document.getElementById('cvTailorProPreviewModal')) return;

      const modal = document.createElement('div');
      modal.id = 'cvTailorProPreviewModal';
      modal.className = 'cv-tailor-pro-modal';
      
      modal.innerHTML = `
        <style>
          .cv-tailor-pro-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999999;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          }
          .cv-tailor-pro-modal.visible {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .modal-container {
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            background: #1a1a2e;
            border-radius: 16px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          .modal-header {
            background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .modal-title {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #000;
            font-weight: 700;
            font-size: 18px;
          }
          .modal-title .score-badge {
            background: #000;
            color: #00ff88;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
          }
          .modal-close {
            background: rgba(0, 0, 0, 0.2);
            border: none;
            color: #000;
            font-size: 24px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
          }
          .modal-close:hover {
            background: rgba(0, 0, 0, 0.3);
          }
          
          .modal-toolbar {
            background: #16213e;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .toolbar-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .toolbar-right {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .zoom-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 12px;
            border-radius: 8px;
          }
          .zoom-btn {
            background: none;
            border: none;
            color: #fff;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            opacity: 0.7;
            transition: opacity 0.2s;
          }
          .zoom-btn:hover { opacity: 1; }
          .zoom-value {
            color: #fff;
            font-size: 14px;
            min-width: 50px;
            text-align: center;
          }
          
          .page-indicator {
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
          }
          
          .modal-content {
            flex: 1;
            overflow: auto;
            padding: 24px;
            background: #0f0f1a;
            display: flex;
            justify-content: center;
          }
          
          .pdf-preview-container {
            background: #fff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            max-width: 100%;
            min-height: 600px;
            padding: 48px;
            transform-origin: top center;
            transition: transform 0.2s ease;
          }
          
          .pdf-text-preview {
            font-family: Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.4;
            color: #000;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .pdf-text-preview .section-header {
            font-weight: bold;
            font-size: 12pt;
            margin-top: 16px;
            margin-bottom: 8px;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
          }
          .pdf-text-preview .name-header {
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
          }
          .pdf-text-preview .contact-line {
            text-align: center;
            color: #333;
            margin-bottom: 16px;
          }
          
          .modal-actions {
            background: #16213e;
            padding: 16px 24px;
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .action-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
          }
          .action-btn.primary {
            background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
            color: #000;
          }
          .action-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.4);
          }
          .action-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
          }
          .action-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          .action-btn.danger {
            background: rgba(255, 68, 68, 0.2);
            color: #ff4444;
          }
          .action-btn.danger:hover {
            background: rgba(255, 68, 68, 0.3);
          }
        </style>
        
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">
              <span>✅</span>
              <span id="modalScoreText">ATS Match Generated!</span>
              <span class="score-badge" id="modalScoreBadge">0%</span>
            </div>
            <button class="modal-close" id="modalCloseBtn" title="Close">×</button>
          </div>
          
          <div class="modal-toolbar">
            <div class="toolbar-left">
              <div class="zoom-controls">
                <button class="zoom-btn" id="zoomOut" title="Zoom Out">−</button>
                <span class="zoom-value" id="zoomValue">100%</span>
                <button class="zoom-btn" id="zoomIn" title="Zoom In">+</button>
                <button class="zoom-btn" id="zoomFit" title="Fit Page">⊡</button>
              </div>
              <span class="page-indicator" id="pageIndicator">Page 1 of 1</span>
            </div>
            <div class="toolbar-right">
              <span id="fileNameDisplay" style="color: rgba(255,255,255,0.7); font-size: 13px;"></span>
            </div>
          </div>
          
          <div class="modal-content">
            <div class="pdf-preview-container" id="pdfPreviewContainer">
              <div class="pdf-text-preview" id="pdfTextPreview">
                Loading preview...
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="action-btn primary" id="downloadPdfBtn">
              <span>⬇️</span> Download PDF
            </button>
            <button class="action-btn secondary" id="copyTextBtn">
              <span>📋</span> Copy to Clipboard
            </button>
            <button class="action-btn secondary" id="editRetailorBtn">
              <span>✏️</span> Edit & Retailor
            </button>
            <button class="action-btn danger" id="discardBtn">
              <span>🗑️</span> Discard
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.bindEvents();
    },

    // ============ BIND EVENTS ============
    bindEvents() {
      // Close button
      document.getElementById('modalCloseBtn')?.addEventListener('click', () => this.hide());
      
      // Zoom controls
      document.getElementById('zoomOut')?.addEventListener('click', () => this.changeZoom(-25));
      document.getElementById('zoomIn')?.addEventListener('click', () => this.changeZoom(25));
      document.getElementById('zoomFit')?.addEventListener('click', () => this.fitPage());
      
      // Action buttons
      document.getElementById('downloadPdfBtn')?.addEventListener('click', () => this.downloadPDF());
      document.getElementById('copyTextBtn')?.addEventListener('click', () => this.copyText());
      document.getElementById('editRetailorBtn')?.addEventListener('click', () => this.editRetailor());
      document.getElementById('discardBtn')?.addEventListener('click', () => this.discard());
      
      // Click outside to close
      const modal = document.getElementById('cvTailorProPreviewModal');
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) this.hide();
      });
    },

    // ============ UPDATE MODAL CONTENT ============
    updateModalContent() {
      const { fileName, cvText, score } = this.currentPDF;

      // Update score badge
      const scoreBadge = document.getElementById('modalScoreBadge');
      const scoreText = document.getElementById('modalScoreText');
      if (scoreBadge) {
        scoreBadge.textContent = `${score}%`;
        scoreBadge.style.color = score >= 90 ? '#00ff88' : score >= 70 ? '#00d4ff' : '#ffa500';
      }
      if (scoreText) {
        scoreText.textContent = score >= 90 ? '🎯 Excellent ATS Match!' : 
                                 score >= 70 ? '✅ Good ATS Match!' : 
                                 '⚠️ ATS Match Generated';
      }

      // Update filename
      const fileNameDisplay = document.getElementById('fileNameDisplay');
      if (fileNameDisplay) fileNameDisplay.textContent = fileName;

      // Update preview text
      this.renderTextPreview(cvText);
    },

    // ============ RENDER TEXT PREVIEW (Formatted) ============
    renderTextPreview(cvText) {
      const container = document.getElementById('pdfTextPreview');
      if (!container || !cvText) return;

      // Parse and format the text
      const lines = cvText.split('\n');
      let html = '';
      
      const sectionHeaders = ['PROFESSIONAL SUMMARY', 'WORK EXPERIENCE', 'EXPERIENCE', 'EDUCATION', 
                              'SKILLS', 'CERTIFICATIONS', 'TECHNICAL PROFICIENCIES'];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // First line is name
        if (i === 0 && line) {
          html += `<div class="name-header">${this.escapeHtml(line)}</div>`;
        }
        // Contact lines (contain | separator)
        else if (i <= 2 && line.includes('|')) {
          html += `<div class="contact-line">${this.escapeHtml(line)}</div>`;
        }
        // Section headers
        else if (sectionHeaders.some(h => line.toUpperCase() === h)) {
          html += `<div class="section-header">${this.escapeHtml(line)}</div>`;
        }
        // Bullet points
        else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('▪')) {
          html += `<div style="margin-left: 16px;">${this.escapeHtml(line)}</div>`;
        }
        // Regular lines
        else if (line) {
          html += `<div>${this.escapeHtml(line)}</div>`;
        }
        // Empty lines
        else {
          html += '<div style="height: 8px;"></div>';
        }
      }

      container.innerHTML = html;
    },

    // ============ ESCAPE HTML ============
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    // ============ ZOOM CONTROLS ============
    changeZoom(delta) {
      this.zoom = Math.max(50, Math.min(150, this.zoom + delta));
      this.applyZoom();
    },

    fitPage() {
      this.zoom = 100;
      this.applyZoom();
    },

    applyZoom() {
      const container = document.getElementById('pdfPreviewContainer');
      const zoomValue = document.getElementById('zoomValue');
      
      if (container) {
        container.style.transform = `scale(${this.zoom / 100})`;
      }
      if (zoomValue) {
        zoomValue.textContent = `${this.zoom}%`;
      }
    },

    // ============ ACTION HANDLERS ============
    downloadPDF() {
      const { pdfBase64, pdfBlob, fileName } = this.currentPDF;
      
      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (pdfBase64) {
        const binary = atob(pdfBase64);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
          view[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      if (this.callbacks?.onDownload) {
        this.callbacks.onDownload(this.currentPDF);
      }

      console.log('[PDFPreviewModal] Downloaded:', fileName);
    },

    copyText() {
      const { cvText } = this.currentPDF;
      
      if (cvText) {
        navigator.clipboard.writeText(cvText)
          .then(() => {
            const btn = document.getElementById('copyTextBtn');
            if (btn) {
              const originalText = btn.innerHTML;
              btn.innerHTML = '<span>✓</span> Copied!';
              setTimeout(() => { btn.innerHTML = originalText; }, 2000);
            }
          })
          .catch(err => console.error('Copy failed:', err));
      }

      if (this.callbacks?.onCopy) {
        this.callbacks.onCopy(cvText);
      }
    },

    editRetailor() {
      this.hide();
      if (this.callbacks?.onEdit) {
        this.callbacks.onEdit(this.currentPDF);
      }
    },

    discard() {
      this.hide();
      if (this.callbacks?.onDiscard) {
        this.callbacks.onDiscard();
      }
    },

    // ============ KEYBOARD HANDLER ============
    handleKeydown(e) {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.hide();
          break;
        case '+':
        case '=':
          this.changeZoom(25);
          break;
        case '-':
          this.changeZoom(-25);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          // Scroll down
          const content = document.querySelector('.modal-content');
          if (content) content.scrollTop += 100;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          // Scroll up
          const content2 = document.querySelector('.modal-content');
          if (content2) content2.scrollTop -= 100;
          break;
      }
    },

    // ============ HIDE MODAL ============
    hide() {
      const modal = document.getElementById('cvTailorProPreviewModal');
      if (modal) {
        modal.classList.remove('visible');
        this.isOpen = false;
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
      }
    }
  };

  // Export globally
  global.PDFPreviewModal = PDFPreviewModal;

})(typeof window !== 'undefined' ? window : this);
