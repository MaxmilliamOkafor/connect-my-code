// cv-upload-panel.js - Generic Multi-User CV Upload & Management
// OpenResume-style CV import from PDF/DOCX/Text with form fallback

(function(global) {
  'use strict';

  const CVUploadPanel = {
    // ============ STATE ============
    isOpen: false,
    currentCV: null,
    mode: 'upload', // 'upload' or 'manual'

    // ============ SHOW UPLOAD PANEL ============
    show(options = {}) {
      const { onSave, onCancel, existingCV } = options;
      this.callbacks = { onSave, onCancel };
      this.currentCV = existingCV || null;
      
      this.createPanel();
      
      const panel = document.getElementById('cvUploadPanel');
      if (panel) {
        panel.classList.add('visible');
        this.isOpen = true;
        
        if (this.currentCV) {
          this.populateForm(this.currentCV);
        }
      }
    },

    // ============ CREATE PANEL DOM ============
    createPanel() {
      if (document.getElementById('cvUploadPanel')) return;

      const panel = document.createElement('div');
      panel.id = 'cvUploadPanel';
      panel.className = 'cv-upload-panel';
      
      panel.innerHTML = `
        <style>
          .cv-upload-panel {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999998;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(8px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          }
          .cv-upload-panel.visible {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
          }
          
          .upload-container {
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            background: #1a1a2e;
            border-radius: 16px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          .upload-header {
            background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .upload-title {
            color: #fff;
            font-weight: 700;
            font-size: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .upload-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: #fff;
            font-size: 24px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
          }
          .upload-close:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          .upload-tabs {
            display: flex;
            background: #16213e;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .upload-tab {
            flex: 1;
            padding: 14px 20px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border-bottom: 3px solid transparent;
          }
          .upload-tab.active {
            color: #00d4ff;
            border-bottom-color: #00d4ff;
            background: rgba(0, 212, 255, 0.1);
          }
          .upload-tab:hover:not(.active) {
            color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.05);
          }
          
          .upload-content {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            background: #0f0f1a;
          }
          
          /* Upload Zone */
          .upload-zone {
            border: 2px dashed rgba(0, 212, 255, 0.4);
            border-radius: 12px;
            padding: 40px 20px;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
          }
          .upload-zone:hover, .upload-zone.dragover {
            border-color: #00d4ff;
            background: rgba(0, 212, 255, 0.05);
          }
          .upload-zone .upload-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .upload-zone .upload-text {
            color: #fff;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .upload-zone .upload-hint {
            color: rgba(255, 255, 255, 0.5);
            font-size: 13px;
          }
          .upload-zone input[type="file"] {
            display: none;
          }
          
          /* Form Fields */
          .form-section {
            margin-bottom: 24px;
          }
          .form-section-title {
            color: #00d4ff;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .form-row.full {
            grid-template-columns: 1fr;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .form-group label {
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            font-weight: 500;
          }
          .form-group input,
          .form-group textarea {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            padding: 10px 12px;
            color: #fff;
            font-size: 14px;
            transition: all 0.2s;
          }
          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #00d4ff;
            background: rgba(0, 212, 255, 0.1);
          }
          .form-group textarea {
            min-height: 100px;
            resize: vertical;
          }
          
          .experience-entry {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            position: relative;
          }
          .experience-remove {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(255, 68, 68, 0.2);
            border: none;
            color: #ff4444;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
          }
          
          .add-entry-btn {
            background: rgba(0, 212, 255, 0.1);
            border: 1px dashed rgba(0, 212, 255, 0.4);
            color: #00d4ff;
            padding: 12px;
            border-radius: 8px;
            width: 100%;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }
          .add-entry-btn:hover {
            background: rgba(0, 212, 255, 0.2);
            border-color: #00d4ff;
          }
          
          .upload-actions {
            background: #16213e;
            padding: 16px 24px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          }
          
          .upload-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .upload-btn.primary {
            background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
            color: #fff;
          }
          .upload-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
          }
          .upload-btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
          }
          .upload-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          .parse-status {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 8px;
            padding: 12px;
            margin-top: 16px;
            color: #00ff88;
            font-size: 14px;
            display: none;
          }
          .parse-status.visible { display: block; }
          .parse-status.error {
            background: rgba(255, 68, 68, 0.1);
            border-color: rgba(255, 68, 68, 0.3);
            color: #ff4444;
          }
        </style>
        
        <div class="upload-container">
          <div class="upload-header">
            <div class="upload-title">
              <span>📄</span>
              <span>Import Your CV</span>
            </div>
            <button class="upload-close" id="uploadCloseBtn" title="Close">×</button>
          </div>
          
          <div class="upload-tabs">
            <button class="upload-tab active" data-tab="upload">📤 Upload File</button>
            <button class="upload-tab" data-tab="manual">✏️ Manual Entry</button>
          </div>
          
          <div class="upload-content">
            <!-- Upload Tab -->
            <div id="uploadTab" class="tab-content">
              <div class="upload-zone" id="uploadZone">
                <div class="upload-icon">📄</div>
                <div class="upload-text">Drag & drop your CV here</div>
                <div class="upload-hint">or click to browse (PDF, DOCX, TXT)</div>
                <input type="file" id="cvFileInput" accept=".pdf,.docx,.doc,.txt,.rtf">
              </div>
              <div class="parse-status" id="parseStatus"></div>
            </div>
            
            <!-- Manual Entry Tab -->
            <div id="manualTab" class="tab-content" style="display: none;">
              <div class="form-section">
                <div class="form-section-title">👤 Personal Information</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>First Name</label>
                    <input type="text" id="cvFirstName" placeholder="John">
                  </div>
                  <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" id="cvLastName" placeholder="Doe">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="cvEmail" placeholder="john@example.com">
                  </div>
                  <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" id="cvPhone" placeholder="+1 234 567 8900">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Location</label>
                    <input type="text" id="cvLocation" placeholder="New York, NY">
                  </div>
                  <div class="form-group">
                    <label>LinkedIn URL</label>
                    <input type="url" id="cvLinkedin" placeholder="linkedin.com/in/johndoe">
                  </div>
                </div>
              </div>
              
              <div class="form-section">
                <div class="form-section-title">📝 Professional Summary</div>
                <div class="form-row full">
                  <div class="form-group">
                    <textarea id="cvSummary" placeholder="Brief professional summary highlighting your key qualifications..."></textarea>
                  </div>
                </div>
              </div>
              
              <div class="form-section">
                <div class="form-section-title">💼 Work Experience</div>
                <div id="experienceEntries"></div>
                <button class="add-entry-btn" id="addExperienceBtn">+ Add Experience</button>
              </div>
              
              <div class="form-section">
                <div class="form-section-title">🎓 Education</div>
                <div id="educationEntries"></div>
                <button class="add-entry-btn" id="addEducationBtn">+ Add Education</button>
              </div>
              
              <div class="form-section">
                <div class="form-section-title">🛠️ Skills</div>
                <div class="form-row full">
                  <div class="form-group">
                    <label>Skills (comma-separated)</label>
                    <input type="text" id="cvSkills" placeholder="JavaScript, Python, React, AWS, SQL...">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="upload-actions">
            <button class="upload-btn secondary" id="uploadCancelBtn">Cancel</button>
            <button class="upload-btn primary" id="uploadSaveBtn">💾 Save CV</button>
          </div>
        </div>
      `;

      document.body.appendChild(panel);
      this.bindEvents();
    },

    // ============ BIND EVENTS ============
    bindEvents() {
      // Close button
      document.getElementById('uploadCloseBtn')?.addEventListener('click', () => this.hide());
      document.getElementById('uploadCancelBtn')?.addEventListener('click', () => this.hide());
      
      // Tab switching
      document.querySelectorAll('.upload-tab').forEach(tab => {
        tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
      });
      
      // File upload
      const uploadZone = document.getElementById('uploadZone');
      const fileInput = document.getElementById('cvFileInput');
      
      uploadZone?.addEventListener('click', () => fileInput?.click());
      uploadZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
      });
      uploadZone?.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
      });
      uploadZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) this.handleFileUpload(file);
      });
      
      fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.handleFileUpload(file);
      });
      
      // Add experience/education buttons
      document.getElementById('addExperienceBtn')?.addEventListener('click', () => this.addExperienceEntry());
      document.getElementById('addEducationBtn')?.addEventListener('click', () => this.addEducationEntry());
      
      // Save button
      document.getElementById('uploadSaveBtn')?.addEventListener('click', () => this.saveCV());
      
      // Click outside to close
      const panel = document.getElementById('cvUploadPanel');
      panel?.addEventListener('click', (e) => {
        if (e.target === panel) this.hide();
      });
    },

    // ============ TAB SWITCHING ============
    switchTab(tabName) {
      this.mode = tabName;
      
      document.querySelectorAll('.upload-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });
      
      document.getElementById('uploadTab').style.display = tabName === 'upload' ? 'block' : 'none';
      document.getElementById('manualTab').style.display = tabName === 'manual' ? 'block' : 'none';
    },

    // ============ HANDLE FILE UPLOAD ============
    async handleFileUpload(file) {
      const status = document.getElementById('parseStatus');
      status.textContent = '⏳ Parsing CV...';
      status.className = 'parse-status visible';

      try {
        if (typeof CVTailorPro !== 'undefined') {
          const result = await CVTailorPro.parseUploadedCV(file);
          
          if (result.success) {
            this.currentCV = result.data;
            status.textContent = `✅ CV parsed successfully! Found ${result.data.experience?.length || 0} jobs, ${result.data.skills?.length || 0} skills.`;
            status.className = 'parse-status visible';
            
            // Populate manual form with parsed data
            this.populateForm(result.data);
            
            // Switch to manual tab to show/edit parsed data
            setTimeout(() => this.switchTab('manual'), 1000);
          } else {
            throw new Error(result.error);
          }
        } else {
          throw new Error('CV parser not available');
        }
      } catch (error) {
        status.textContent = `❌ Parse failed: ${error.message}. Try manual entry.`;
        status.className = 'parse-status visible error';
        console.error('[CVUploadPanel] Parse error:', error);
      }
    },

    // ============ POPULATE FORM ============
    populateForm(cv) {
      if (!cv) return;

      const p = cv.personal || {};
      const nameParts = (p.name || '').split(' ');
      
      document.getElementById('cvFirstName').value = nameParts[0] || '';
      document.getElementById('cvLastName').value = nameParts.slice(1).join(' ') || '';
      document.getElementById('cvEmail').value = p.email || '';
      document.getElementById('cvPhone').value = p.phone || '';
      document.getElementById('cvLocation').value = p.location || '';
      document.getElementById('cvLinkedin').value = p.linkedin || '';
      document.getElementById('cvSummary').value = cv.summary || '';
      document.getElementById('cvSkills').value = (cv.skills || []).join(', ');

      // Clear and add experience entries
      const expContainer = document.getElementById('experienceEntries');
      expContainer.innerHTML = '';
      (cv.experience || []).forEach(exp => this.addExperienceEntry(exp));

      // Clear and add education entries
      const eduContainer = document.getElementById('educationEntries');
      eduContainer.innerHTML = '';
      (cv.education || []).forEach(edu => this.addEducationEntry(edu));
    },

    // ============ ADD EXPERIENCE ENTRY ============
    addExperienceEntry(data = {}) {
      const container = document.getElementById('experienceEntries');
      const entry = document.createElement('div');
      entry.className = 'experience-entry';
      
      entry.innerHTML = `
        <button class="experience-remove" type="button">×</button>
        <div class="form-row">
          <div class="form-group">
            <label>Company</label>
            <input type="text" class="exp-company" value="${data.company || ''}" placeholder="Company Name">
          </div>
          <div class="form-group">
            <label>Title</label>
            <input type="text" class="exp-title" value="${data.title || ''}" placeholder="Job Title">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Dates</label>
            <input type="text" class="exp-dates" value="${data.dates || ''}" placeholder="Jan 2020 - Present">
          </div>
          <div class="form-group">
            <label>Location</label>
            <input type="text" class="exp-location" value="${data.location || ''}" placeholder="City, State">
          </div>
        </div>
        <div class="form-row full">
          <div class="form-group">
            <label>Accomplishments (one per line)</label>
            <textarea class="exp-bullets" placeholder="• Led team of 5 engineers...">${(data.bullets || []).map(b => '• ' + b).join('\n')}</textarea>
          </div>
        </div>
      `;
      
      entry.querySelector('.experience-remove').addEventListener('click', () => entry.remove());
      container.appendChild(entry);
    },

    // ============ ADD EDUCATION ENTRY ============
    addEducationEntry(data = {}) {
      const container = document.getElementById('educationEntries');
      const entry = document.createElement('div');
      entry.className = 'experience-entry';
      
      entry.innerHTML = `
        <button class="experience-remove" type="button">×</button>
        <div class="form-row">
          <div class="form-group">
            <label>Institution</label>
            <input type="text" class="edu-institution" value="${data.institution || ''}" placeholder="University Name">
          </div>
          <div class="form-group">
            <label>Degree</label>
            <input type="text" class="edu-degree" value="${data.degree || ''}" placeholder="Bachelor of Science in...">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Dates</label>
            <input type="text" class="edu-dates" value="${data.dates || ''}" placeholder="2016 - 2020">
          </div>
          <div class="form-group">
            <label>GPA (optional)</label>
            <input type="text" class="edu-gpa" value="${data.gpa || ''}" placeholder="3.8">
          </div>
        </div>
      `;
      
      entry.querySelector('.experience-remove').addEventListener('click', () => entry.remove());
      container.appendChild(entry);
    },

    // ============ COLLECT FORM DATA ============
    collectFormData() {
      const cv = {
        personal: {
          name: `${document.getElementById('cvFirstName').value} ${document.getElementById('cvLastName').value}`.trim(),
          email: document.getElementById('cvEmail').value,
          phone: document.getElementById('cvPhone').value,
          location: document.getElementById('cvLocation').value,
          linkedin: document.getElementById('cvLinkedin').value
        },
        summary: document.getElementById('cvSummary').value,
        experience: [],
        education: [],
        skills: document.getElementById('cvSkills').value.split(',').map(s => s.trim()).filter(s => s),
        certifications: []
      };

      // Collect experience entries
      document.querySelectorAll('#experienceEntries .experience-entry').forEach(entry => {
        const bullets = entry.querySelector('.exp-bullets').value
          .split('\n')
          .map(b => b.replace(/^[•\-*]\s*/, '').trim())
          .filter(b => b);
        
        cv.experience.push({
          company: entry.querySelector('.exp-company').value,
          title: entry.querySelector('.exp-title').value,
          dates: entry.querySelector('.exp-dates').value,
          location: entry.querySelector('.exp-location').value,
          bullets
        });
      });

      // Collect education entries
      document.querySelectorAll('#educationEntries .education-entry, #educationEntries .experience-entry').forEach(entry => {
        cv.education.push({
          institution: entry.querySelector('.edu-institution').value,
          degree: entry.querySelector('.edu-degree').value,
          dates: entry.querySelector('.edu-dates').value,
          gpa: entry.querySelector('.edu-gpa').value
        });
      });

      return cv;
    },

    // ============ SAVE CV ============
    async saveCV() {
      const cv = this.collectFormData();
      
      // Validate required fields
      if (!cv.personal.name) {
        alert('Please enter your name');
        return;
      }

      // Save to storage
      if (typeof CVTailorPro !== 'undefined') {
        await CVTailorPro.saveUserCV(cv);
      } else {
        // Fallback to chrome.storage directly
        await new Promise(resolve => {
          chrome.storage.sync.set({ cvTailorPro_userCV: cv }, resolve);
        });
      }

      console.log('[CVUploadPanel] CV saved:', cv);
      
      if (this.callbacks?.onSave) {
        this.callbacks.onSave(cv);
      }

      this.hide();
    },

    // ============ HIDE PANEL ============
    hide() {
      const panel = document.getElementById('cvUploadPanel');
      if (panel) {
        panel.classList.remove('visible');
        this.isOpen = false;
      }
      
      if (this.callbacks?.onCancel) {
        this.callbacks.onCancel();
      }
    }
  };

  // Export globally
  global.CVUploadPanel = CVUploadPanel;

})(typeof window !== 'undefined' ? window : this);
