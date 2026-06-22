/* ==========================================================================
   Accessible Portfolio Interactivity & Utilities
   Bolligarla Siva Subrahmanyeswara Rao | Software Engineer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleText = themeToggle.querySelector('.theme-toggle-text');
  const menuBtn = document.getElementById('menu-btn');
  const mainMenu = document.getElementById('main-menu');
  const menuLinks = mainMenu.querySelectorAll('.nav-link');
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const skipLink = document.querySelector('.skip-link');

  /* --------------------------------------------------------------------------
     1. Theme Switcher System (Dark / Light Mode)
     -------------------------------------------------------------------------- */
  const initTheme = () => {
    // Check local storage or default to dark mode
    const savedTheme = localStorage.getItem('portfolio-theme');
    
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.setAttribute('aria-checked', 'false');
      themeToggleText.textContent = 'Dark Mode Off';
    } else {
      // Default / Dark mode
      document.documentElement.removeAttribute('data-theme');
      themeToggle.setAttribute('aria-checked', 'true');
      themeToggleText.textContent = 'Dark Mode On';
    }
  };

  const toggleTheme = () => {
    const isDark = !document.documentElement.hasAttribute('data-theme');
    
    if (isDark) {
      // Switch to Light
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggle.setAttribute('aria-checked', 'false');
      themeToggleText.textContent = 'Dark Mode Off';
      localStorage.setItem('portfolio-theme', 'light');
    } else {
      // Switch to Dark
      document.documentElement.removeAttribute('data-theme');
      themeToggle.setAttribute('aria-checked', 'true');
      themeToggleText.textContent = 'Dark Mode On';
      localStorage.setItem('portfolio-theme', 'dark');
    }
  };

  themeToggle.addEventListener('click', toggleTheme);
  initTheme();

  /* --------------------------------------------------------------------------
     2. Mobile Drawer Navigation & Keyboard Focus Trapping
     -------------------------------------------------------------------------- */
  const isMobileMenuOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';

  const toggleMobileMenu = () => {
    const isOpen = isMobileMenuOpen();
    menuBtn.setAttribute('aria-expanded', !isOpen);
    menuBtn.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    mainMenu.classList.toggle('is-open', !isOpen);

    if (!isOpen) {
      document.body.style.overflow = 'hidden';
      if (menuLinks.length > 0) {
        setTimeout(() => menuLinks[0].focus(), 50);
      }
    } else {
      document.body.style.overflow = '';
      menuBtn.focus();
    }
  };

  menuBtn.addEventListener('click', toggleMobileMenu);

  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (isMobileMenuOpen()) {
        toggleMobileMenu();
      }
    });
  });

  // Keyboard Navigation Handling inside Mobile Menu
  document.addEventListener('keydown', (e) => {
    if (!isMobileMenuOpen()) return;

    const focusableElements = [menuBtn, ...menuLinks];
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.key === 'Escape') {
      toggleMobileMenu();
      return;
    }

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  });

  /* --------------------------------------------------------------------------
     3. Skip Link Target Focus Helper
     -------------------------------------------------------------------------- */
  skipLink.addEventListener('click', (e) => {
    const target = document.getElementById('main-content');
    if (target) {
      target.focus();
    }
  });

  /* --------------------------------------------------------------------------
     4. Accessible Form Validation & Backend Posting
     -------------------------------------------------------------------------- */
  let hasSubmitted = false;

  const validateField = (input) => {
    const errorId = `${input.id}-error`;
    const errorElement = document.getElementById(errorId);
    let isValid = true;
    let errorMessage = '';

    if (input.required && !input.value.trim()) {
      isValid = false;
      errorMessage = `${getFieldName(input)} is required.`;
    } else if (input.type === 'email' && input.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value.trim())) {
        isValid = false;
        errorMessage = 'Please enter a valid email address.';
      }
    }

    if (!isValid) {
      input.setAttribute('aria-invalid', 'true');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
      }
    } else {
      input.setAttribute('aria-invalid', 'false');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
    }

    return isValid;
  };

  const getFieldName = (input) => {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return label.textContent.replace('*', '').trim();
    }
    return input.name || 'This field';
  };

  const formInputs = contactForm.querySelectorAll('input, textarea');
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      if (hasSubmitted) {
        validateField(input);
      }
    });

    input.addEventListener('blur', () => {
      if (hasSubmitted) {
        validateField(input);
      }
    });
  });

  // Submit Handler
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hasSubmitted = true;
    
    let isFormValid = true;
    let firstInvalidElement = null;
    let errorCount = 0;

    // Reset status alert
    formStatus.className = 'form-status';
    formStatus.textContent = '';
    formStatus.removeAttribute('tabindex');

    // Validate all inputs
    formInputs.forEach(input => {
      const isInputValid = validateField(input);
      if (!isInputValid) {
        isFormValid = false;
        errorCount++;
        if (!firstInvalidElement) {
          firstInvalidElement = input;
        }
      }
    });

    if (!isFormValid) {
      // Display accessible alert details
      formStatus.classList.add('error-alert');
      formStatus.textContent = `The form contains ${errorCount} error${errorCount > 1 ? 's' : ''}. Please correct the highlighted fields below.`;
      
      if (firstInvalidElement) {
        firstInvalidElement.focus();
      }
    } else {
      // Form values are valid on client side -> Post to Express backend
      formStatus.classList.add('success-alert');
      formStatus.textContent = 'Submitting message to server...';

      // Read form data values
      const formData = {
        name: contactForm.elements['name'].value,
        email: contactForm.elements['email'].value,
        message: contactForm.elements['message'].value
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(response => {
        return response.json().then(data => {
          if (!response.ok) {
            throw new Error(data.message || 'Server error occurred during submission.');
          }
          return data;
        });
      })
      .then(data => {
        // Success response from Express backend
        formStatus.className = 'form-status success-alert';
        formStatus.textContent = data.message || 'Thank you! Your message has been received.';
        
        // Reset form variables and fields
        contactForm.reset();
        hasSubmitted = false;
        
        formInputs.forEach(input => {
          input.setAttribute('aria-invalid', 'false');
          const errorId = `${input.id}-error`;
          const errorElement = document.getElementById(errorId);
          if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
          }
        });

        // Shift focus to success alert banner
        formStatus.setAttribute('tabindex', '-1');
        formStatus.focus();
      })
      .catch(err => {
        // Handle server/network errors
        formStatus.className = 'form-status error-alert';
        formStatus.textContent = err.message || 'Failed to submit form to backend server. Please try again.';
        
        // Shift focus to error alert banner
        formStatus.setAttribute('tabindex', '-1');
        formStatus.focus();
      });
    }
  });
});
