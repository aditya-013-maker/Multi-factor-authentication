/* -------------------------------------------------------------
 * Tata Steel Enterprise MFA Demonstration Portal
 * Upgraded JavaScript Logic (SPA Routing, MFA OTP, Themes, Charts)
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM CACHE - VIEW SECTIONS ---
  const views = {
    login: document.getElementById('view-login'),
    mfa: document.getElementById('view-mfa'),
    success: document.getElementById('view-success'),
    dashboard: document.getElementById('view-dashboard')
  };

  // --- DOM CACHE - GLOBAL ELEMENTS ---
  const globalHeader = document.getElementById('global-header');
  const globalFooter = document.getElementById('global-footer');
  const themeToggle = document.getElementById('theme-toggle');
  const themeMoonIcon = document.getElementById('theme-moon');
  const themeSunIcon = document.getElementById('theme-sun');

  // --- DOM CACHE - LOGIN VIEW ---
  const loginForm = document.getElementById('portal-login-form');
  const loginIdInput = document.getElementById('login-employee-id');
  const loginPasswordInput = document.getElementById('login-password');
  const loginPasswordToggle = document.getElementById('login-password-toggle');
  const loginEyeIcon = document.getElementById('login-eye-icon');
  const loginCaptchaInput = document.getElementById('login-captcha-input');
  const loginCaptchaCanvas = document.getElementById('login-captcha-canvas');
  const loginCaptchaRefresh = document.getElementById('login-captcha-refresh');
  const loginAlert = document.getElementById('login-alert');
  const loginAlertText = document.getElementById('login-alert-text');
  const btnQuickFill = document.getElementById('btn-quick-fill');

  // Inline Validation Warning Labels
  const idError = document.getElementById('login-id-error');
  const passwordError = document.getElementById('login-password-error');
  const captchaError = document.getElementById('login-captcha-error');

  // Password Checklist Requirements
  const checklist = {
    length: document.getElementById('req-char-length'),
    upper: document.getElementById('req-char-upper'),
    lower: document.getElementById('req-char-lower'),
    number: document.getElementById('req-char-number'),
    special: document.getElementById('req-char-special')
  };
  const strengthMeter = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnLoginReset = document.getElementById('btn-login-reset');

  // --- DOM CACHE - MFA VIEW ---
  const mfaForm = document.getElementById('portal-mfa-form');
  const mfaOtpInput = document.getElementById('mfa-otp-input');
  const mfaMethodList = document.getElementById('mfa-method-list');
  const mfaMethodInstruction = document.getElementById('mfa-method-instruction');
  const mfaAlert = document.getElementById('mfa-alert');
  const mfaAlertText = document.getElementById('mfa-alert-text');
  const otpCountdownText = document.getElementById('otp-countdown');
  const otpTimerContainer = document.getElementById('otp-timer-container');
  const mfaResendBtn = document.getElementById('btn-mfa-resend');
  const mfaVerifyBtn = document.getElementById('btn-mfa-verify');
  const mfaCancelBtn = document.getElementById('btn-mfa-cancel');

  // --- DOM CACHE - SUCCESS VIEW ---
  const btnSuccessDashboard = document.getElementById('btn-success-dashboard');
  const btnSuccessLogout = document.getElementById('btn-success-logout');
  const successTimestamp = document.getElementById('success-timestamp');

  // --- DOM CACHE - DASHBOARD VIEW ---
  const sidebarLinks = document.querySelectorAll('.nav-link');
  const dashboardPanes = document.querySelectorAll('.dashboard-pane');
  const btnDashboardLogout = document.getElementById('btn-dashboard-logout');
  const welcomeDate = document.getElementById('welcome-date');
  const welcomeTime = document.getElementById('welcome-time');
  const cyberStatusText = document.getElementById('cyber-status-text');

  // Security Page Specifics
  const mfaToggleInput = document.getElementById('mfa-toggle-input');
  const securityScoreGauge = document.getElementById('security-score-gauge');
  const scoreText = document.getElementById('score-text');

  // --- STATIC SETTINGS ---
  const DEMO_CREDENTIALS = {
    employeeId: 'EMP12345',
    password: 'Demo@123',
    otp: '123456'
  };

  // --- STATE VARIABLES ---
  let currentCaptchaText = '';
  let activeMfaMethod = 'sms'; // 'sms', 'email', 'app'
  let otpTimerInterval = null;
  let timeRemaining = 60;
  let isMfaEnforced = true; // Controlled by the Security Center page toggle

  /* =================================================================
   * 1. ROUTING ENGINE (SPA View Manager)
   * ================================================================= */
  function navigateTo(viewName) {
    // Hide all views
    Object.values(views).forEach(view => {
      if (view) view.classList.add('hidden');
    });

    // Show selected view
    const targetView = views[viewName];
    if (targetView) {
      targetView.classList.remove('hidden');
      
      // Auto focus elements upon entering views
      if (viewName === 'login') {
        loginIdInput.focus();
        // Show global header/footer on login, mfa, and success
        globalHeader.classList.remove('hidden');
        globalFooter.classList.remove('hidden');
      } else if (viewName === 'mfa') {
        mfaOtpInput.focus();
        globalHeader.classList.remove('hidden');
        globalFooter.classList.remove('hidden');
      } else if (viewName === 'success') {
        globalHeader.classList.remove('hidden');
        globalFooter.classList.remove('hidden');
      } else if (viewName === 'dashboard') {
        // Dashboard contains its own internal layout, we hide the landing page global header/footer to make room for full screen app sidebar!
        globalHeader.classList.add('hidden');
        globalFooter.classList.add('hidden');
        
        // Reset sub-panes to default (Dashboard Summary)
        switchDashboardPane('dash-pane-summary');
        
        // Trigger charts animations
        animateDashboardCharts();
      }
    }
  }

  /* =================================================================
   * 2. THEME CONTROLLER (Dark / Light Mode)
   * ================================================================= */
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeMoonIcon.classList.add('hidden');
      themeSunIcon.classList.remove('hidden');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeSunIcon.classList.add('hidden');
      themeMoonIcon.classList.remove('hidden');
      localStorage.setItem('theme', 'light');
    }
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  });

  /* =================================================================
   * 3. CAPTCHA GENERATOR
   * ================================================================= */
  function generateCaptcha() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const len = 5;
    let text = '';
    for (let i = 0; i < len; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    currentCaptchaText = text;
    
    if (loginCaptchaCanvas) {
      loginCaptchaCanvas.setAttribute('data-captcha', text);
      drawCaptcha(text);
    }
  }

  function drawCaptcha(text) {
    const ctx = loginCaptchaCanvas.getContext('2d');
    const w = loginCaptchaCanvas.width;
    const h = loginCaptchaCanvas.height;

    // Reset background
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, h);
    
    // Gradient adapts to theme colors roughly
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
    } else {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Overlay noise lines
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = getRandomColor(isDark ? 100 : 150, 220);
      ctx.lineWidth = Math.random() * 2 + 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // Overlay noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = getRandomColor(isDark ? 100 : 150, 220);
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Render characters
    ctx.textBaseline = 'middle';
    const spacing = w / (text.length + 1);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const size = Math.floor(Math.random() * 6) + 24; // 24-30px
      const angle = (Math.random() * 30 - 15) * Math.PI / 180; // -15 to +15 deg
      const jitterY = Math.random() * 8 - 4;

      ctx.save();
      ctx.translate(spacing * (i + 1), h / 2 + jitterY);
      ctx.rotate(angle);

      ctx.font = `bold ${size}px "Poppins", "Courier New", Courier, monospace`;
      ctx.fillStyle = getRandomColor(isDark ? 150 : 0, isDark ? 255 : 100);
      ctx.fillText(char, -size / 4, 0);

      ctx.restore();
    }
  }

  function getRandomColor(min, max) {
    const r = Math.floor(Math.random() * (max - min) + min);
    const g = Math.floor(Math.random() * (max - min) + min);
    const b = Math.floor(Math.random() * (max - min) + min);
    return `rgb(${r},${g},${b})`;
  }

  loginCaptchaRefresh.addEventListener('click', () => {
    generateCaptcha();
    loginCaptchaInput.value = '';
    loginCaptchaInput.focus();
  });

  // Demo Credentials Quick Fill
  if (btnQuickFill) {
    btnQuickFill.addEventListener('click', () => {
      if (loginIdInput) loginIdInput.value = DEMO_CREDENTIALS.employeeId;
      if (loginPasswordInput) {
        loginPasswordInput.value = DEMO_CREDENTIALS.password;
        // Trigger password validation to check off requirements
        evaluatePassword(DEMO_CREDENTIALS.password);
      }
      if (loginCaptchaInput) {
        // Auto fill the generated captcha code for instant demo ease
        loginCaptchaInput.value = currentCaptchaText;
      }
      
      // Clear previous validation error styles
      if (idError) idError.classList.add('hidden');
      if (passwordError) passwordError.classList.add('hidden');
      if (captchaError) captchaError.classList.add('hidden');
      if (loginIdInput) loginIdInput.classList.remove('input-invalid');
      if (loginPasswordInput) loginPasswordInput.classList.remove('input-invalid');
      if (loginCaptchaInput) loginCaptchaInput.classList.remove('input-invalid');
      if (loginAlert) loginAlert.classList.add('hidden');

      // Visual success confirmation flash animation
      const originalText = btnQuickFill.innerHTML;
      btnQuickFill.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Credentials Loaded!</span>
      `;
      const originalBg = btnQuickFill.style.backgroundColor;
      const originalBoxShadow = btnQuickFill.style.boxShadow;
      btnQuickFill.style.backgroundColor = '#10B981'; // Tailwind Emerald 500
      btnQuickFill.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.3)';
      
      setTimeout(() => {
        btnQuickFill.innerHTML = originalText;
        btnQuickFill.style.backgroundColor = originalBg;
        btnQuickFill.style.boxShadow = originalBoxShadow;
      }, 1500);
    });
  }

  /* =================================================================
   * 4. PASSWORD STRENGTH & REQUIREMENTS VALIDATOR
   * ================================================================= */
  function evaluatePassword(password) {
    // Check specific conditions
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
    };

    // Toggle checklist visual states
    toggleChecklistItem(checklist.length, checks.length);
    toggleChecklistItem(checklist.upper, checks.upper);
    toggleChecklistItem(checklist.lower, checks.lower);
    toggleChecklistItem(checklist.number, checks.number);
    toggleChecklistItem(checklist.special, checks.special);

    // Compute active strength
    let score = 0;
    if (password.length > 0) {
      if (checks.length) score++;
      if (checks.upper) score++;
      if (checks.lower) score++;
      if (checks.number) score++;
      if (checks.special) score++;
    }

    updateStrengthMeter(score);
  }

  function toggleChecklistItem(element, isValid) {
    if (!element) return;
    if (isValid) {
      element.classList.remove('invalid');
      element.classList.add('valid');
      element.setAttribute('aria-checked', 'true');
    } else {
      element.classList.remove('valid');
      element.classList.add('invalid');
      element.setAttribute('aria-checked', 'false');
    }
  }

  function updateStrengthMeter(score) {
    if (!strengthMeter || !strengthText) return;

    let width = '0%';
    let color = 'transparent';
    let label = 'None';

    if (score === 1) {
      width = '20%';
      color = 'var(--danger-red)';
      label = 'Very Weak';
    } else if (score === 2) {
      width = '40%';
      color = '#f59e0b'; // Orange
      label = 'Weak';
    } else if (score === 3) {
      width = '60%';
      color = '#eab308'; // Yellow
      label = 'Medium';
    } else if (score === 4) {
      width = '80%';
      color = 'var(--accent)';
      label = 'Strong';
    } else if (score === 5) {
      width = '100%';
      color = 'var(--success-green)';
      label = 'Very Secure';
    }

    strengthMeter.style.width = width;
    strengthMeter.style.backgroundColor = color;
    strengthText.textContent = `Password Strength: ${label}`;
    
    // Add color representation in text label too
    strengthText.style.color = score > 0 ? color : 'var(--text-light)';
  }

  loginPasswordInput.addEventListener('input', (e) => {
    evaluatePassword(e.target.value);
  });

  // Password Toggle Visibility
  loginPasswordToggle.addEventListener('click', () => {
    const isPassword = loginPasswordInput.getAttribute('type') === 'password';
    if (isPassword) {
      loginPasswordInput.setAttribute('type', 'text');
      loginPasswordToggle.setAttribute('aria-label', 'Hide password');
      loginEyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    } else {
      loginPasswordInput.setAttribute('type', 'password');
      loginPasswordToggle.setAttribute('aria-label', 'Show password');
      loginEyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  });

  /* =================================================================
   * 5. LOGIN FORM SUBMISSION VALIDATOR
   * ================================================================= */
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset warnings
    idError.classList.add('hidden');
    passwordError.classList.add('hidden');
    captchaError.classList.add('hidden');
    loginAlert.classList.add('hidden');
    
    loginIdInput.classList.remove('input-invalid');
    loginPasswordInput.classList.remove('input-invalid');
    loginCaptchaInput.classList.remove('input-invalid');

    const id = loginIdInput.value.trim();
    const pass = loginPasswordInput.value;
    const captcha = loginCaptchaInput.value.trim();

    let hasEmpty = false;

    // Check empty
    if (id === '') {
      idError.classList.remove('hidden');
      loginIdInput.classList.add('input-invalid');
      hasEmpty = true;
    }
    if (pass === '') {
      passwordError.classList.remove('hidden');
      loginPasswordInput.classList.add('input-invalid');
      hasEmpty = true;
    }
    if (captcha === '') {
      captchaError.classList.remove('hidden');
      loginCaptchaInput.classList.add('input-invalid');
      hasEmpty = true;
    }

    if (hasEmpty) {
      if (id === '') loginIdInput.focus();
      else if (pass === '') loginPasswordInput.focus();
      else loginCaptchaInput.focus();
      return;
    }

    // CAPTCHA check
    if (captcha.toUpperCase() !== currentCaptchaText.toUpperCase()) {
      showLoginAlert('Incorrect CAPTCHA. Please try again.');
      loginCaptchaInput.classList.add('input-invalid');
      loginCaptchaInput.value = '';
      generateCaptcha();
      loginCaptchaInput.focus();
      return;
    }

    // Credential check
    if (id !== DEMO_CREDENTIALS.employeeId || pass !== DEMO_CREDENTIALS.password) {
      showLoginAlert('Incorrect Employee ID or Password.');
      loginIdInput.classList.add('input-invalid');
      loginPasswordInput.classList.add('input-invalid');
      
      loginCaptchaInput.value = '';
      generateCaptcha();
      loginIdInput.focus();
      return;
    }

    // Proceed to secondary authentication step (MFA) or skip if toggled off
    triggerLoginLoading(() => {
      if (isMfaEnforced) {
        navigateTo('mfa');
        startMfaTimer();
      } else {
        // MFA disabled, go straight to success dashboard
        navigateTo('success');
        updateSuccessTimestamp();
      }
    });
  });

  function showLoginAlert(msg) {
    loginAlertText.textContent = msg;
    loginAlert.classList.remove('hidden');
    loginAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function triggerLoginLoading(callback) {
    const btnText = btnLoginSubmit.querySelector('.btn-text');
    const spinner = btnLoginSubmit.querySelector('.spinner');

    if (btnText && spinner) {
      btnText.textContent = 'Verifying credentials...';
      spinner.classList.remove('hidden');
    }

    // Disable buttons
    loginIdInput.disabled = true;
    loginPasswordInput.disabled = true;
    loginCaptchaInput.disabled = true;
    btnLoginSubmit.disabled = true;
    btnLoginReset.disabled = true;

    setTimeout(() => {
      // Re-enable
      loginIdInput.disabled = false;
      loginPasswordInput.disabled = false;
      loginCaptchaInput.disabled = false;
      btnLoginSubmit.disabled = false;
      btnLoginReset.disabled = false;

      if (btnText && spinner) {
        btnText.textContent = 'Login';
        spinner.classList.add('hidden');
      }

      callback();
    }, 1000);
  }

  // Login Reset
  function resetLoginForm() {
    loginForm.reset();
    
    // Reset password visibility toggler
    loginPasswordInput.setAttribute('type', 'password');
    loginPasswordToggle.setAttribute('aria-label', 'Show password');
    loginEyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;

    // Clear alerts/warnings
    idError.classList.add('hidden');
    passwordError.classList.add('hidden');
    captchaError.classList.add('hidden');
    loginAlert.classList.add('hidden');

    loginIdInput.classList.remove('input-invalid');
    loginPasswordInput.classList.remove('input-invalid');
    loginCaptchaInput.classList.remove('input-invalid');

    // Reset password strength gauge
    updateStrengthMeter(0);
    Object.values(checklist).forEach(el => {
      if (el) {
        el.classList.remove('valid');
        el.classList.add('invalid');
      }
    });

    // Refresh captcha
    generateCaptcha();
    loginIdInput.focus();
  }

  btnLoginReset.addEventListener('click', resetLoginForm);

  /* =================================================================
   * 6. MULTI-FACTOR AUTHENTICATION (MFA) HANDLERS
   * ================================================================= */
  
  // Select active OTP factor method
  mfaMethodList.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('.mfa-method-btn');
    if (!targetBtn) return;

    // Toggle active state in list
    mfaMethodList.querySelectorAll('.mfa-method-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    targetBtn.classList.add('active');
    targetBtn.setAttribute('aria-selected', 'true');

    activeMfaMethod = targetBtn.dataset.method;
    updateMfaMethodInstructions();

    // Restart OTP flow
    resetMfaOtpFlow();
  });

  function updateMfaMethodInstructions() {
    let msg = '';
    let placeholder = '';
    
    if (activeMfaMethod === 'sms') {
      msg = 'Enter the 6-digit verification code sent via SMS to your registered device ending in **45.';
      placeholder = 'Enter 6-digit SMS OTP';
    } else if (activeMfaMethod === 'email') {
      msg = 'Enter the 6-digit verification code sent to your registered corporate email address: de***@tatasteel.demo';
      placeholder = 'Enter 6-digit Email OTP';
    } else if (activeMfaMethod === 'app') {
      msg = 'Open your registered Authenticator App (Google/Microsoft) and enter the current 6-digit dynamic token.';
      placeholder = 'Enter 6-digit App Token';
    }

    mfaMethodInstruction.textContent = msg;
    mfaOtpInput.placeholder = placeholder;
  }

  function startMfaTimer() {
    clearInterval(otpTimerInterval);
    timeRemaining = 60;
    otpCountdownText.textContent = timeRemaining;
    otpTimerContainer.classList.remove('hidden');
    mfaResendBtn.classList.add('disabled');
    mfaResendBtn.disabled = true;

    // Output simulated code for debugging/evaluation convenience
    console.log(`[MFA System] Generated active dynamic OTP code for testing: ${DEMO_CREDENTIALS.otp}`);

    otpTimerInterval = setInterval(() => {
      timeRemaining--;
      otpCountdownText.textContent = timeRemaining;

      if (timeRemaining <= 0) {
        clearInterval(otpTimerInterval);
        otpTimerContainer.classList.add('hidden');
        mfaResendBtn.classList.remove('disabled');
        mfaResendBtn.disabled = false;
        console.log(`[MFA System] Verification OTP expired.`);
      }
    }, 1000);
  }

  function resetMfaOtpFlow() {
    mfaOtpInput.value = '';
    mfaOtpInput.classList.remove('input-invalid');
    mfaOtpError.classList.add('hidden');
    mfaAlert.classList.add('hidden');
    startMfaTimer();
    mfaOtpInput.focus();
  }

  mfaResendBtn.addEventListener('click', () => {
    resetMfaOtpFlow();
    alert('Simulated code resent. Please check your web browser console logs for the active token.');
  });

  mfaCancelBtn.addEventListener('click', () => {
    clearInterval(otpTimerInterval);
    navigateTo('login');
    resetLoginForm();
  });

  // Verify OTP submission
  mfaForm.addEventListener('submit', (e) => {
    e.preventDefault();

    mfaAlert.classList.add('hidden');
    mfaOtpInput.classList.remove('input-invalid');
    mfaOtpError.classList.add('hidden');

    const otp = mfaOtpInput.value.trim();

    if (otp === '') {
      mfaOtpError.classList.remove('hidden');
      mfaOtpInput.classList.add('input-invalid');
      mfaOtpInput.focus();
      return;
    }

    if (otp !== DEMO_CREDENTIALS.otp) {
      mfaAlertText.textContent = 'Incorrect OTP. Please try again.';
      mfaAlert.classList.remove('hidden');
      mfaOtpInput.classList.add('input-invalid');
      mfaOtpInput.focus();
      return;
    }

    // Verification Success!
    triggerMfaVerifySuccess();
  });

  function triggerMfaVerifySuccess() {
    clearInterval(otpTimerInterval);
    const btnText = mfaVerifyBtn.querySelector('.btn-text');
    const spinner = mfaVerifyBtn.querySelector('.spinner');

    if (btnText && spinner) {
      btnText.textContent = 'Verifying identity...';
      spinner.classList.remove('hidden');
    }

    mfaOtpInput.disabled = true;
    mfaVerifyBtn.disabled = true;
    mfaCancelBtn.disabled = true;

    setTimeout(() => {
      // Re-enable elements
      mfaOtpInput.disabled = false;
      mfaVerifyBtn.disabled = false;
      mfaCancelBtn.disabled = false;

      if (btnText && spinner) {
        btnText.textContent = 'Verify Identity';
        spinner.classList.add('hidden');
      }

      // Success transition
      navigateTo('success');
      updateSuccessTimestamp();
    }, 1200);
  }

  function updateSuccessTimestamp() {
    const now = new Date();
    const formatted = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0') + ':' + 
      String(now.getSeconds()).padStart(2, '0');
    
    successTimestamp.textContent = formatted;
  }

  /* =================================================================
   * 7. SUCCESS VIEW BUTTON ACTIONS
   * ================================================================= */
  btnSuccessDashboard.addEventListener('click', () => {
    navigateTo('dashboard');
  });

  btnSuccessLogout.addEventListener('click', () => {
    navigateTo('login');
    resetLoginForm();
  });

  /* =================================================================
   * 8. SIDEBAR NAVIGATION ENGINE (Dashboard Sub-view Controller)
   * ================================================================= */
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const clickedBtn = e.currentTarget;
      const targetPaneId = clickedBtn.dataset.target;
      
      switchDashboardPane(targetPaneId);
    });
  });

  function switchDashboardPane(paneId) {
    // 1. Deactivate other nav buttons, activate clicked one
    sidebarLinks.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.target === paneId) {
        btn.classList.add('active');
      }
    });

    // 2. Hide other dashboard panes, show clicked one
    dashboardPanes.forEach(pane => {
      pane.classList.add('hidden');
    });

    const targetPane = document.getElementById(paneId);
    if (targetPane) {
      targetPane.classList.remove('hidden');
    }

    // 3. Redraw elements or restart clocks if needed
    if (paneId === 'dash-pane-summary') {
      animateDashboardCharts();
    } else if (paneId === 'dash-pane-security') {
      animateSecurityGauge();
    }
  }

  // Bind Quick Metric link buttons
  document.querySelectorAll('.ql-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPane = e.currentTarget.dataset.trigger;
      switchDashboardPane(targetPane);
    });
  });

  // Sidebar Logout Button
  btnDashboardLogout.addEventListener('click', () => {
    navigateTo('login');
    resetLoginForm();
  });

  /* =================================================================
   * 9. DYNAMIC DASHBOARD DATA & SVG CHARTS
   * ================================================================= */
  
  // Real-time welcome banner clock
  function initDashboardClock() {
    setInterval(() => {
      const now = new Date();
      
      // Update date format: YYYY-MM-DD
      const dateStr = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0');
      
      // Update time format: HH:MM:SS
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0') + ':' + 
        String(now.getSeconds()).padStart(2, '0');

      if (welcomeDate) welcomeDate.textContent = dateStr;
      if (welcomeTime) welcomeTime.textContent = timeStr;
    }, 1000);
  }

  // Animate mock SVG charts (redraw paths/rects)
  function animateDashboardCharts() {
    // Animate line chart path
    const linePath = document.querySelector('#mfa-line-chart .animate-path');
    if (linePath) {
      linePath.style.animation = 'none';
      linePath.offsetHeight; /* trigger reflow */
      linePath.style.animation = 'drawLine 2.5s ease-out forwards';
    }

    // Animate column chart bars
    const chartBars = document.querySelectorAll('#attempts-column-chart .chart-bar');
    chartBars.forEach(bar => {
      bar.style.animation = 'none';
      bar.offsetHeight;
      bar.style.animation = 'growBar 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards';
    });
  }

  // Animate the radial score gauge inside Security page
  function animateSecurityGauge() {
    const gaugeCircle = document.querySelector('#security-score-gauge circle:nth-child(2)');
    if (gaugeCircle) {
      const targetScore = isMfaEnforced ? 95 : 35;
      
      // Circumference = 2 * PI * r = 2 * 3.14159 * 40 = 251.2px
      const dashOffset = (1 - (targetScore / 100)) * 251.2;
      
      gaugeCircle.style.transition = 'none';
      gaugeCircle.setAttribute('stroke-dashoffset', '251.2');
      gaugeCircle.offsetHeight; // trigger reflow
      
      gaugeCircle.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
      gaugeCircle.setAttribute('stroke-dashoffset', String(dashOffset));
      
      // Update text
      scoreText.textContent = `${targetScore}%`;
      
      // Update stroke color matching safety
      const badge = document.querySelector('.score-metadata .badge-success') || 
                    document.querySelector('.score-metadata .badge-warning') || 
                    document.querySelector('.score-metadata .badge-danger');
      
      if (targetScore >= 80) {
        gaugeCircle.setAttribute('stroke', 'var(--success-green)');
        scoreText.setAttribute('fill', 'var(--success-green)');
        if (badge) {
          badge.textContent = 'EXCELLENT';
          badge.className = 'badge-success';
          badge.style.backgroundColor = '';
          badge.style.color = '';
        }
        document.querySelector('.score-metadata p').textContent = 'MFA is enabled on this account, shielding it from 99.9% of automated credential theft attempts.';
      } else {
        gaugeCircle.setAttribute('stroke', 'var(--danger-red)');
        scoreText.setAttribute('fill', 'var(--danger-red)');
        if (badge) {
          badge.textContent = 'HIGH RISK';
          badge.className = 'badge-warning';
          badge.style.backgroundColor = 'var(--danger-light)';
          badge.style.color = 'var(--danger-red)';
        }
        document.querySelector('.score-metadata p').textContent = 'MFA is disabled. This account is vulnerable to credential compromise and unauthorized server access.';
      }
    }
  }

  /* =================================================================
   * 10. SECURITY CENTER INTERACTIVE TOGGLES
   * ================================================================= */
  if (mfaToggleInput) {
    mfaToggleInput.addEventListener('change', (e) => {
      isMfaEnforced = e.target.checked;
      
      // Live updates Dashboard Metric Box
      if (isMfaEnforced) {
        cyberStatusText.textContent = 'MFA Secure';
        cyberStatusText.className = 'metric-value text-green';
      } else {
        cyberStatusText.textContent = 'MFA Disabled';
        cyberStatusText.className = 'metric-value text-orange';
      }
      
      // Dynamic updates Security Page Gauge
      animateSecurityGauge();
    });
  }

  /* =================================================================
   * 11. CHANGE PASSWORD SUB-FORM (Settings Panel Mockup)
   * ================================================================= */
  const changePasswordForm = document.getElementById('settings-change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPass = document.getElementById('old-password').value;
      const newPass = document.getElementById('new-password').value;
      const confirmNewPass = document.getElementById('confirm-new-password').value;

      if (!oldPass || !newPass || !confirmNewPass) {
        alert('Please fill out all password fields.');
        return;
      }

      if (newPass !== confirmNewPass) {
        alert('Confirm password does not match new password.');
        return;
      }

      if (newPass.length < 8) {
        alert('New password must satisfy complexity constraints (minimum 8 characters).');
        return;
      }

      // Success
      alert('Password updated successfully! (Demonstration mock update completed)');
      changePasswordForm.reset();
    });
  }

  /* =================================================================
   * INITIALIZATION ON APPLICATION STARTUP
   * ================================================================= */
  initTheme();
  generateCaptcha();
  initDashboardClock();
  
  // Clear inputs and boot to landing page (Login view)
  resetLoginForm();
  navigateTo('login');
});
