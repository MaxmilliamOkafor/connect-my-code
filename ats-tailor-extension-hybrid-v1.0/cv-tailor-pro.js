// cv-tailor-pro.js - CV Tailor Pro Engine (OpenResume-style)
// 100% Generic Multi-User CV Tailoring with PDF Preview
// Inspired by xitanggg/open-resume (8.1k stars)

(function(global) {
  'use strict';

  const CVTailorPro = {
    // ============ CONFIGURATION ============
    CONFIG: {
      // PDF Specs (ATS-Perfect)
      font: 'Arial',
      fontSize: { name: 14, section: 11, body: 10.5, small: 9 },
      margins: { top: 72, bottom: 72, left: 72, right: 72 }, // 1" all sides
      lineHeight: 1.15,
      pageWidth: 595.28,
      pageHeight: 841.89,
      maxPages: 2,
      
      // Timing targets
      timing: {
        detect: 0,
        banner: 25,
        buttonClick: 50,
        extract: 125,
        pipelineComplete: 175
      }
    },

    // ============ USER CV STORAGE ============
    userCV: null,
    preferences: {
      autoTailor: true,
      theme: 'light',
      template: 'professional'
    },

    // ============ NATURAL INJECTION TEMPLATES ============
    INJECTION_TEMPLATES: [
      'Led {keyword} implementations achieving 20% improvement',
      'Applied {keyword} in Agile sprints for scalable solutions',
      'Demonstrated {keyword} expertise across production deployments',
      'Utilized {keyword} to streamline cross-functional workflows',
      'Implemented {keyword} strategies driving measurable outcomes',
      'Leveraged {keyword} for high-impact project delivery',
      'Integrated {keyword} solutions within enterprise environments',
      'Developed {keyword} capabilities enhancing team productivity'
    ],

    // ============ INITIALIZE ============
    async init() {
      await this.loadUserCV();
      await this.loadPreferences();
      console.log('[CVTailorPro] Initialized. User CV loaded:', !!this.userCV);
      return this;
    },

    // ============ LOAD USER CV FROM STORAGE ============
    async loadUserCV() {
      return new Promise(resolve => {
        chrome.storage.sync.get(['cvTailorPro_userCV'], result => {
          this.userCV = result.cvTailorPro_userCV || null;
          resolve(this.userCV);
        });
      });
    },

    // ============ SAVE USER CV TO STORAGE ============
    async saveUserCV(cvData) {
      this.userCV = cvData;
      return new Promise(resolve => {
        chrome.storage.sync.set({ cvTailorPro_userCV: cvData }, resolve);
      });
    },

    // ============ LOAD PREFERENCES ============
    async loadPreferences() {
      return new Promise(resolve => {
        chrome.storage.sync.get(['cvTailorPro_preferences'], result => {
          this.preferences = { ...this.preferences, ...(result.cvTailorPro_preferences || {}) };
          resolve(this.preferences);
        });
      });
    },

    // ============ SAVE PREFERENCES ============
    async savePreferences(prefs) {
      this.preferences = { ...this.preferences, ...prefs };
      return new Promise(resolve => {
        chrome.storage.sync.set({ cvTailorPro_preferences: this.preferences }, resolve);
      });
    },

    // ============ PARSE UPLOADED CV ============
    async parseUploadedCV(file) {
      const startTime = performance.now();
      console.log('[CVTailorPro] Parsing uploaded CV:', file.name);

      try {
        const content = await this.readFileContent(file);
        const parsed = this.parseResumeText(content);
        
        // Save to storage
        await this.saveUserCV(parsed);
        
        const timing = performance.now() - startTime;
        console.log(`[CVTailorPro] CV parsed in ${timing.toFixed(0)}ms`);
        
        return {
          success: true,
          data: parsed,
          timing
        };
      } catch (error) {
        console.error('[CVTailorPro] Parse error:', error);
        return { success: false, error: error.message };
      }
    },

    // ============ READ FILE CONTENT ============
    async readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const content = e.target.result;
          
          if (file.type === 'application/pdf') {
            // For PDF, we'd need PDF.js parsing - for now, prompt user to use text
            resolve(content);
          } else {
            // Text-based files
            resolve(content);
          }
        };
        
        reader.onerror = reject;
        
        if (file.type === 'application/pdf') {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      });
    },

    // ============ PARSE RESUME TEXT (OpenResume-style) ============
    parseResumeText(text) {
      const sections = {
        personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        certifications: []
      };

      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      let currentSection = null;
      let currentExperience = null;
      let currentEducation = null;

      // Section header patterns
      const sectionPatterns = {
        summary: /^(professional\s+summary|summary|profile|objective|about)/i,
        experience: /^(work\s+experience|experience|employment|professional\s+experience|career)/i,
        education: /^(education|academic|qualifications)/i,
        skills: /^(skills|technical\s+skills|core\s+competencies|key\s+skills)/i,
        certifications: /^(certifications|certificates|licenses)/i
      };

      // First line is usually the name
      if (lines.length > 0 && !Object.values(sectionPatterns).some(p => p.test(lines[0]))) {
        sections.personal.name = lines[0];
      }

      // Extract email/phone/linkedin from first few lines
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
        const phoneMatch = line.match(/[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4}/);
        const linkedinMatch = line.match(/linkedin\.com\/in\/[\w-]+/i);
        const githubMatch = line.match(/github\.com\/[\w-]+/i);

        if (emailMatch) sections.personal.email = emailMatch[0];
        if (phoneMatch) sections.personal.phone = phoneMatch[0];
        if (linkedinMatch) sections.personal.linkedin = linkedinMatch[0];
        if (githubMatch) sections.personal.github = githubMatch[0];
      }

      // Parse sections
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for section headers
        let foundSection = null;
        for (const [section, pattern] of Object.entries(sectionPatterns)) {
          if (pattern.test(line)) {
            foundSection = section;
            break;
          }
        }

        if (foundSection) {
          // Save previous experience/education if any
          if (currentExperience) {
            sections.experience.push(currentExperience);
            currentExperience = null;
          }
          if (currentEducation) {
            sections.education.push(currentEducation);
            currentEducation = null;
          }
          currentSection = foundSection;
          continue;
        }

        // Parse content based on current section
        switch (currentSection) {
          case 'summary':
            sections.summary += (sections.summary ? ' ' : '') + line;
            break;

          case 'experience':
            // Check if this is a new role (contains company name or title pattern)
            const isNewRole = /\||\–|–|-/.test(line) && line.length < 100;
            const datePattern = /\b(20\d{2}|19\d{2}|Present|Current)\b/i;
            
            if (isNewRole || datePattern.test(line)) {
              if (currentExperience) {
                sections.experience.push(currentExperience);
              }
              const parts = line.split(/\||\–|–|-/).map(p => p.trim());
              currentExperience = {
                company: parts[0] || '',
                title: parts[1] || '',
                dates: parts.find(p => datePattern.test(p)) || '',
                location: parts[parts.length - 1] || '',
                bullets: []
              };
            } else if (currentExperience && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
              currentExperience.bullets.push(line.replace(/^[•\-*]\s*/, ''));
            } else if (currentExperience) {
              // Might be continuation of last bullet
              if (currentExperience.bullets.length > 0) {
                currentExperience.bullets[currentExperience.bullets.length - 1] += ' ' + line;
              }
            }
            break;

          case 'education':
            if (/university|college|institute|school|academy/i.test(line) || /bachelor|master|phd|degree|diploma/i.test(line)) {
              if (currentEducation) {
                sections.education.push(currentEducation);
              }
              currentEducation = {
                institution: '',
                degree: '',
                dates: '',
                gpa: ''
              };
              
              if (/university|college|institute|school|academy/i.test(line)) {
                currentEducation.institution = line.split(/\||\–/)[0].trim();
              }
              if (/bachelor|master|phd|degree|diploma/i.test(line)) {
                currentEducation.degree = line;
              }
              const gpaMatch = line.match(/GPA[:\s]*(\d+\.?\d*)/i);
              if (gpaMatch) currentEducation.gpa = gpaMatch[1];
            }
            break;

          case 'skills':
            // Skills are usually comma-separated or bullet points
            const skills = line.replace(/^[•\-*]\s*/, '').split(/[,;]/).map(s => s.trim()).filter(s => s.length > 1);
            sections.skills.push(...skills);
            break;

          case 'certifications':
            if (line.length > 3) {
              sections.certifications.push(line.replace(/^[•\-*]\s*/, ''));
            }
            break;
        }
      }

      // Save last experience/education
      if (currentExperience) sections.experience.push(currentExperience);
      if (currentEducation) sections.education.push(currentEducation);

      // Deduplicate skills
      sections.skills = [...new Set(sections.skills)];

      return sections;
    },

    // ============ EXTRACT KEYWORDS FROM JD ============
    extractJDKeywords(jobDescription) {
      if (!jobDescription) return { all: [], high: [], medium: [], low: [] };

      const startTime = performance.now();
      
      // Technical keyword patterns
      const techPatterns = [
        // Programming languages
        /\b(Python|JavaScript|TypeScript|Java|C\+\+|C#|Ruby|Go|Rust|Swift|Kotlin|PHP|Scala|R)\b/gi,
        // Frameworks
        /\b(React|Angular|Vue|Next\.js|Node\.js|Express|Django|Flask|Spring|Rails|Laravel|\.NET)\b/gi,
        // Databases
        /\b(SQL|PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Cassandra|Oracle|SQLite)\b/gi,
        // Cloud
        /\b(AWS|Azure|GCP|Google Cloud|S3|EC2|Lambda|Kubernetes|Docker|Terraform|CloudFormation)\b/gi,
        // Tools
        /\b(Git|GitHub|GitLab|Jenkins|CircleCI|Travis|Jira|Confluence|Slack|VS Code)\b/gi,
        // Concepts
        /\b(API|REST|GraphQL|Microservices|CI\/CD|DevOps|Agile|Scrum|TDD|BDD|OOP)\b/gi,
        // Data
        /\b(Machine Learning|ML|AI|Data Science|Analytics|ETL|Spark|Hadoop|Tableau|Power BI)\b/gi
      ];

      const foundKeywords = new Set();
      
      for (const pattern of techPatterns) {
        const matches = jobDescription.match(pattern) || [];
        matches.forEach(m => foundKeywords.add(m));
      }

      // Also extract requirements from bullet points
      const requirementPattern = /(?:^|\n)[•\-*]\s*(.+?)(?:\n|$)/g;
      let match;
      while ((match = requirementPattern.exec(jobDescription)) !== null) {
        const requirement = match[1];
        // Extract key phrases
        const phrases = requirement.match(/\b[A-Z][a-zA-Z0-9\-\.]+(?:\s+[A-Z][a-zA-Z0-9\-\.]+)?\b/g) || [];
        phrases.forEach(p => {
          if (p.length >= 2 && p.length <= 30) foundKeywords.add(p);
        });
      }

      const all = [...foundKeywords].slice(0, 50);
      const highCount = Math.ceil(all.length * 0.4);
      const medCount = Math.ceil(all.length * 0.35);

      const timing = performance.now() - startTime;
      console.log(`[CVTailorPro] Extracted ${all.length} keywords in ${timing.toFixed(0)}ms`);

      return {
        all,
        high: all.slice(0, highCount),
        medium: all.slice(highCount, highCount + medCount),
        low: all.slice(highCount + medCount)
      };
    },

    // ============ TAILOR CV WITH KEYWORDS ============
    tailorCV(userCV, keywords) {
      if (!userCV || !keywords?.all?.length) {
        return { tailored: userCV, score: 0, injected: [] };
      }

      const startTime = performance.now();
      const tailored = JSON.parse(JSON.stringify(userCV)); // Deep clone
      const injected = [];
      
      // Check which keywords are already present
      const cvText = JSON.stringify(userCV).toLowerCase();
      const missing = keywords.all.filter(k => !cvText.includes(k.toLowerCase()));
      
      // Strategy 1: Inject into experience bullets (priority)
      let keywordIdx = 0;
      if (tailored.experience && missing.length > 0) {
        for (const job of tailored.experience) {
          if (!job.bullets) job.bullets = [];
          
          for (let i = 0; i < job.bullets.length && keywordIdx < missing.length; i++) {
            // Add 1-2 keywords per bullet
            const numToAdd = Math.min(2, missing.length - keywordIdx);
            const toAdd = missing.slice(keywordIdx, keywordIdx + numToAdd);
            keywordIdx += numToAdd;
            
            // Natural injection
            const template = this.INJECTION_TEMPLATES[i % this.INJECTION_TEMPLATES.length];
            const injectionPhrase = toAdd.length === 1
              ? `, leveraging ${toAdd[0]}`
              : `, utilizing ${toAdd.join(' and ')}`;
            
            job.bullets[i] = job.bullets[i].replace(/\.?\s*$/, injectionPhrase + '.');
            injected.push(...toAdd);
          }
        }
      }

      // Strategy 2: Inject into skills
      const remainingKeywords = missing.slice(keywordIdx);
      if (remainingKeywords.length > 0) {
        tailored.skills = [...(tailored.skills || []), ...remainingKeywords.slice(0, 15)];
        injected.push(...remainingKeywords.slice(0, 15));
      }

      // Strategy 3: Inject into summary
      const stillRemaining = remainingKeywords.slice(15);
      if (stillRemaining.length > 0 && tailored.summary) {
        const expertise = stillRemaining.slice(0, 5).join(', ');
        tailored.summary += `. Expertise includes ${expertise}.`;
        injected.push(...stillRemaining.slice(0, 5));
      }

      // Calculate final score
      const tailoredText = JSON.stringify(tailored).toLowerCase();
      const matched = keywords.all.filter(k => tailoredText.includes(k.toLowerCase()));
      const score = Math.round((matched.length / keywords.all.length) * 100);

      const timing = performance.now() - startTime;
      console.log(`[CVTailorPro] CV tailored in ${timing.toFixed(0)}ms. Score: ${score}%`);

      return { tailored, score, matched, missing: missing.filter(m => !injected.includes(m)), injected, timing };
    },

    // ============ GENERATE TAILORED CV TEXT ============
    generateCVText(tailoredCV) {
      if (!tailoredCV) return '';

      const lines = [];
      const p = tailoredCV.personal || {};

      // Header
      lines.push((p.name || 'APPLICANT NAME').toUpperCase());
      
      const contactParts = [p.phone, p.email, p.location].filter(Boolean);
      if (contactParts.length) lines.push(contactParts.join(' | '));
      
      const linkParts = [p.linkedin, p.github].filter(Boolean);
      if (linkParts.length) lines.push(linkParts.join(' | '));
      
      lines.push('');

      // Summary
      if (tailoredCV.summary) {
        lines.push('PROFESSIONAL SUMMARY');
        lines.push(tailoredCV.summary);
        lines.push('');
      }

      // Experience
      if (tailoredCV.experience?.length) {
        lines.push('WORK EXPERIENCE');
        for (const job of tailoredCV.experience) {
          const header = [job.company, job.title, job.dates, job.location].filter(Boolean).join(' | ');
          lines.push(header);
          lines.push('');
          if (job.bullets) {
            for (const bullet of job.bullets) {
              lines.push('• ' + bullet);
            }
          }
          lines.push('');
        }
      }

      // Education
      if (tailoredCV.education?.length) {
        lines.push('EDUCATION');
        for (const edu of tailoredCV.education) {
          const parts = [edu.institution, edu.degree, edu.dates, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean);
          lines.push(parts.join(' | '));
        }
        lines.push('');
      }

      // Skills
      if (tailoredCV.skills?.length) {
        lines.push('SKILLS');
        lines.push(tailoredCV.skills.slice(0, 25).join(', '));
        lines.push('');
      }

      // Certifications
      if (tailoredCV.certifications?.length) {
        lines.push('CERTIFICATIONS');
        lines.push(tailoredCV.certifications.join(', '));
      }

      return lines.join('\n');
    },

    // ============ GENERATE PDF (ATS-Perfect) ============
    async generatePDF(tailoredCV, candidateData) {
      const startTime = performance.now();
      const cvText = this.generateCVText(tailoredCV);
      
      // Generate filename: {FirstName}_{LastName}_ATS_CV.pdf
      const firstName = (tailoredCV?.personal?.name?.split(' ')[0] || candidateData?.firstName || 'Applicant')
        .replace(/[^a-zA-Z]/g, '');
      const lastName = (tailoredCV?.personal?.name?.split(' ').slice(1).join('_') || candidateData?.lastName || '')
        .replace(/[^a-zA-Z]/g, '');
      const fileName = lastName ? `${firstName}_${lastName}_ATS_CV.pdf` : `${firstName}_ATS_CV.pdf`;

      // Use PDFATSTurbo if available
      if (typeof PDFATSTurbo !== 'undefined') {
        const result = await PDFATSTurbo.generateATSPerfectCV(
          { 
            firstName: tailoredCV?.personal?.name?.split(' ')[0], 
            lastName: tailoredCV?.personal?.name?.split(' ').slice(1).join(' '),
            email: tailoredCV?.personal?.email,
            phone: tailoredCV?.personal?.phone,
            linkedin: tailoredCV?.personal?.linkedin,
            github: tailoredCV?.personal?.github,
            city: tailoredCV?.personal?.location
          },
          cvText,
          {},
          []
        );
        return { ...result, fileName };
      }

      // Fallback: Use jsPDF if available
      if (typeof jspdf !== 'undefined') {
        const { jsPDF } = jspdf;
        const doc = new jsPDF({ format: 'a4', unit: 'pt' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        
        const lines = doc.splitTextToSize(cvText, 480);
        let y = 72;
        
        for (const line of lines) {
          if (y > 770) {
            doc.addPage();
            y = 72;
          }
          doc.text(line, 72, y);
          y += 14;
        }
        
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const timing = performance.now() - startTime;
        
        return { pdf: pdfBase64, fileName, text: cvText, timing };
      }

      // Ultimate fallback: text-only
      const timing = performance.now() - startTime;
      return { text: cvText, fileName, timing };
    },

    // ============ FULL TAILORING PIPELINE ============
    async fullPipeline(jobData, userCV = null) {
      const pipelineStart = performance.now();
      const cv = userCV || this.userCV;

      if (!cv) {
        throw new Error('No CV uploaded. Please upload your CV first.');
      }

      // Step 1: Extract keywords
      const keywords = this.extractJDKeywords(jobData?.description || '');
      console.log(`[CVTailorPro] Step 1: Extracted ${keywords.all.length} keywords`);

      // Step 2: Tailor CV
      const tailorResult = this.tailorCV(cv, keywords);
      console.log(`[CVTailorPro] Step 2: CV tailored, score: ${tailorResult.score}%`);

      // Step 3: Generate text
      const cvText = this.generateCVText(tailorResult.tailored);
      console.log(`[CVTailorPro] Step 3: Generated ${cvText.length} chars of text`);

      // Step 4: Generate PDF
      const pdfResult = await this.generatePDF(tailorResult.tailored, cv.personal);
      console.log(`[CVTailorPro] Step 4: PDF generated: ${pdfResult.fileName}`);

      const pipelineTiming = performance.now() - pipelineStart;
      console.log(`[CVTailorPro] Full pipeline completed in ${pipelineTiming.toFixed(0)}ms`);

      return {
        keywords,
        tailored: tailorResult.tailored,
        cvText,
        pdf: pdfResult.pdf,
        fileName: pdfResult.fileName,
        score: tailorResult.score,
        matched: tailorResult.matched,
        missing: tailorResult.missing,
        injected: tailorResult.injected,
        timing: pipelineTiming
      };
    }
  };

  // Export globally
  global.CVTailorPro = CVTailorPro;

})(typeof window !== 'undefined' ? window : this);
