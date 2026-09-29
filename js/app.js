// API Base URL Configuration
// En localhost usa port 5000 (backend), en producción usa ruta relativa
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin;

// Info Panel Toggle
const infoPanelToggle = document.getElementById('infoPanelToggle');
const infoPanel = document.getElementById('infoPanel');

if (infoPanelToggle && infoPanel) {
  infoPanelToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = infoPanel.classList.contains('is-open');
    infoPanel.classList.toggle('is-open');
    infoPanelToggle.setAttribute('aria-expanded', !isOpen);
  });

  // Cerrar el panel si se hace click fuera (desktop)
  document.addEventListener('click', (e) => {
    if (!infoPanel.contains(e.target) && e.target !== infoPanelToggle) {
      infoPanel.classList.remove('is-open');
      infoPanelToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Cerrar panel al hacer scroll en móvil
  let lastScrollY = 0;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const isMobile = window.innerWidth <= 768;

    if (isMobile && infoPanel.classList.contains('is-open') &&
        Math.abs(currentScrollY - lastScrollY) > 10) {
      infoPanel.classList.remove('is-open');
      infoPanelToggle.setAttribute('aria-expanded', 'false');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });
}

// Guest Count Selector - FIX para iOS (sin picker nativo)
const guestSelector = document.getElementById('guestCount');
if (guestSelector) {
  // Store original value to prevent clearing
  const originalValue = guestSelector.value || '2';

  // Validar entrada numérica - SOLO valida el rango, no limpia caracteres
  guestSelector.addEventListener('input', (e) => {
    // Solo permitir números, si hay caracteres no numéricos, mantener valor anterior
    if (!/^\d*$/.test(e.target.value)) {
      e.target.value = originalValue;
      return;
    }

    let val = e.target.value.trim();
    if (val === '') {
      val = '2';
    } else {
      const num = parseInt(val);
      if (num < 1) val = '1';
      if (num > 10) val = '10';
    }
    e.target.value = val;
    const selectedGuests = parseInt(val) || 2;
    console.log(`✅ Guests selected: ${selectedGuests}`);
  });

  // Prevenir caracteres no numéricos en keydown
  guestSelector.addEventListener('keydown', (e) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault();
    }
  });
}

// Calendario Flatpickr - Configuración dinámica de disponibilidad (Lazy-loaded)
function initializeFlatpickr() {
  if (typeof flatpickr === 'undefined') {
    console.warn('Flatpickr not loaded yet, will retry');
    return;
  }

  let occupiedDates = [];

  async function loadAvailability() {
    try {
      const response = await fetch(API_BASE_URL + '/api/availability');
      if (response.ok) {
        const data = await response.json();
        // Convert ISO date strings to Date objects for Flatpickr to parse correctly
        // Use local timezone (no Z suffix) to avoid timezone offset issues
        occupiedDates = (data.unavailable_dates || []).map(dateStr => {
          const [year, month, day] = dateStr.split('-');
          return new Date(year, parseInt(month) - 1, day);
        });
        console.log('[CALENDAR] Loaded unavailable dates:', occupiedDates.length, 'dates');
        initializeCalendar();
      } else {
        console.warn('Could not load availability, using fallback');
        occupiedDates = [];
        initializeCalendar();
      }
    } catch (e) {
      console.warn('Availability load failed, using fallback');
      occupiedDates = [];
      initializeCalendar();
    }
  }

  function initializeCalendar() {
    flatpickr('#dateRange', {
      mode: 'range',
      minDate: 'today',
      minDays: 3,
      dateFormat: 'd M Y',
      conjunctions: 'al',
      locale: {
        rangeSeparator: ' al ',
        weekdays: {
          shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        },
        months: {
          shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        }
      },
      disable: occupiedDates,
      onClose: (selectedDates) => {
        if (selectedDates.length === 2) {
          const checkIn = selectedDates[0].toLocaleDateString('es-ES');
          const checkOut = selectedDates[1].toLocaleDateString('es-ES');
          console.log(`✅ Check-in: ${checkIn}, Check-out: ${checkOut}`);
          updateQuotePreview(selectedDates);
        }
      }
    });
  }

  async function updateQuotePreview(selectedDates) {
    if (selectedDates.length !== 2) return;

    const guestCount = parseInt(document.getElementById('guestCount').value) || 2;
    const checkIn = selectedDates[0].toISOString().split('T')[0];
    const checkOut = selectedDates[1].toISOString().split('T')[0];

    try {
      const response = await fetch(API_BASE_URL + '/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in_date: checkIn,
          check_out_date: checkOut,
          guest_count: guestCount
        })
      });

      if (response.ok) {
        const quote = await response.json();
        document.getElementById('nightsCount').textContent = quote.nights;
        document.getElementById('subtotalPrice').textContent = `$${quote.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('taxesPrice').textContent = `$${quote.taxes.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('totalPrice').innerHTML = `<strong>$${quote.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</strong>`;
      }
    } catch (e) {
      console.log('Quote update failed, keeping manual calculation');
    }
  }

  loadAvailability();
}

// Esperar a que Flatpickr esté disponible (lazy-loaded)
document.addEventListener('flatpickr-ready', () => {
  initializeFlatpickr();
});

// Inicializar Flatpickr si ya está cargado
if (typeof flatpickr !== 'undefined') {
  initializeFlatpickr();
} else if (window.flatpickrLoaded !== false) {
  // Esperar a que se cargue de forma lazy
  const checkFlatpickr = setInterval(() => {
    if (typeof flatpickr !== 'undefined') {
      clearInterval(checkFlatpickr);
      initializeFlatpickr();
    }
  }, 100);
  setTimeout(() => clearInterval(checkFlatpickr), 5000); // Timeout después de 5s
}

// Header scroll effect
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    header.classList.add('is-scrolled');
  } else {
    header.classList.remove('is-scrolled');
  }
}, { passive: true });

// Mobile navigation
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
const navLinks = mainNav.querySelectorAll('.nav-link');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll reveal animation
const revealElements = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealElements.forEach(el => observer.observe(el));
}

// Lightbox gallery
function initLightbox() {
  const lightboxEls = Array.from(document.querySelectorAll('[data-lightbox]'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let currentIndex = 0;

  function openLightbox(index) {
    if (lightboxEls.length === 0) return;
    currentIndex = (index + lightboxEls.length) % lightboxEls.length;
    const fig = lightboxEls[currentIndex];
    const img = fig.querySelector('img');
    const caption = fig.querySelector('figcaption')?.textContent || '';

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = caption;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Click en fotos (desktop + móvil)
  lightboxEls.forEach((fig, i) => {
    fig.style.cursor = 'pointer';
    const handleOpen = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(i);
    };
    fig.addEventListener('click', handleOpen);
    fig.addEventListener('touchend', handleOpen);
    fig.addEventListener('pointerdown', handleOpen, true); // Capture phase para móvil
  });

  // Botones
  if (lightboxClose) {
    lightboxClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(currentIndex - 1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(currentIndex + 1);
    });
  }

  // Click en fondo para cerrar
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Teclado
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
    if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
  });
}

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLightbox);
} else {
  initLightbox();
}

// Accordion Handler
function initAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const accordionItem = header.parentElement;
      const accordionContent = accordionItem.querySelector('.accordion-content');
      const isActive = header.classList.contains('active');

      // Cerrar otros acordeones
      document.querySelectorAll('.accordion-header.active').forEach(h => {
        if (h !== header) {
          h.classList.remove('active');
          h.parentElement.querySelector('.accordion-content').classList.remove('active');
        }
      });

      // Toggle actual
      header.classList.toggle('active', !isActive);
      accordionContent.classList.toggle('active', !isActive);
    });
  });
}

// Inicializar acordeón cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccordion);
} else {
  initAccordion();
}

// Dynamic Price Calculator (fallback if calendar update doesn't fire)
function initPriceCalculator() {
  const dateRangeInput = document.getElementById('dateRange');

  function calculatePrices() {
    if (!dateRangeInput || !dateRangeInput.value) return;
    const dates = dateRangeInput.value.split(' al ');
    if (dates.length !== 2) return;

    const parseDate = (dateStr) => {
      const parts = dateStr.trim().split(' ');
      if (parts.length !== 3) return null;
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIndex = months.indexOf(parts[1]);
      if (monthIndex === -1) return null;
      return new Date(parseInt(parts[2]), monthIndex, parseInt(parts[0]));
    };

    const checkIn = parseDate(dates[0]);
    const checkOut = parseDate(dates[1]);
    if (!checkIn || !checkOut) return;

    const guestCount = parseInt(document.getElementById('guestCount')?.value) || 2;
    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];

    fetch(API_BASE_URL + '/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_in_date: checkInStr,
        check_out_date: checkOutStr,
        guest_count: guestCount
      })
    }).then(r => r.ok ? r.json() : null).then(quote => {
      if (!quote) return;
      const nightsCountEl = document.getElementById('nightsCount');
      const subtotalPriceEl = document.getElementById('subtotalPrice');
      const taxesPriceEl = document.getElementById('taxesPrice');
      const totalPriceEl = document.getElementById('totalPrice');

      if (nightsCountEl) nightsCountEl.textContent = quote.nights;
      if (subtotalPriceEl) subtotalPriceEl.textContent = `$${quote.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      if (taxesPriceEl) taxesPriceEl.textContent = `$${quote.taxes.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      if (totalPriceEl) totalPriceEl.innerHTML = `<strong>$${quote.total_amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</strong>`;
    }).catch(e => console.log('Quote calculation failed'));
  }

  if (dateRangeInput) {
    dateRangeInput.addEventListener('change', calculatePrices);
    dateRangeInput.addEventListener('blur', calculatePrices);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPriceCalculator);
} else {
  initPriceCalculator();
}

// Contact form - WhatsApp Integration
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const email = document.getElementById('email').value.trim();
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const mensaje = document.getElementById('mensaje').value.trim();

    // Validation
    if (nombre.length < 3) {
      showMessage('Por favor ingresa tu nombre completo', 'error');
      return;
    }
    if (telefono.replace(/\D/g, '').length < 7) {
      showMessage('Por favor ingresa un teléfono WhatsApp válido', 'error');
      return;
    }
    if (!checkin || !checkout) {
      showMessage('Por favor selecciona fechas de check-in y check-out', 'error');
      return;
    }

    // Build WhatsApp message
    const whatsappMessage = `Hi! I'm interested in inquiring about Villa Lisanna.\n\n📋 *Details:*\nName: ${nombre}\nPhone: ${telefono}\n${email ? `Email: ${email}\n` : ''}Check-in: ${checkin}\nCheck-out: ${checkout}\n${mensaje ? `\n📝 Message: ${mensaje}` : ''}\n\nWhat is the availability and price?`;

    // Encode for WhatsApp
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/19418000120?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    showMessage('✅ WhatsApp will open. Complete the sending there.', 'success');
    setTimeout(() => contactForm.reset(), 1500);
  });
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;
  formMessage.style.display = 'block';
  setTimeout(() => {
    formMessage.style.display = 'none';
  }, 4000);
}

// Animar elementos con scroll
const animateOnScroll = () => {
  const elements = document.querySelectorAll('[data-animate]');
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      el.classList.add('animated');
    }
  });
};

window.addEventListener('scroll', animateOnScroll, { passive: true });
animateOnScroll();

// Counter animation para estadísticas
const animateCounters = () => {
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(el => {
    const text = el.textContent;
    const num = parseInt(text);
    if (!isNaN(num)) {
      let count = 0;
      const increment = num / 30;
      const counter = setInterval(() => {
        count += increment;
        if (count >= num) {
          el.textContent = num;
          clearInterval(counter);
        } else {
          el.textContent = Math.floor(count);
        }
      }, 50);
    }
  });
};

// Ejecutar cuando stat-cards sean visibles
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      observer.unobserve(entry.target);
    }
  });
});

document.querySelector('.stats-grid') && observer.observe(document.querySelector('.stats-grid'));

// CEREBRO FIX: Función para mostrar errores visibles en el banner
function showError(msg) {
  console.error('[CEREBRO ERROR - VISIBLE]', msg);
  const banner = document.getElementById('errorBanner');
  const text = document.getElementById('errorBannerText');
  if (banner && text) {
    text.textContent = '❌ ' + msg;
    banner.style.display = 'block';
  }
  // También mostrar alert
  alert('❌ ' + msg);
}

// CEREBRO FIX: Desactivar pointer-events en elementos decorativos
document.addEventListener('DOMContentLoaded', () => {
  // Forzar pointer-events: none en todos los overlays/decorativos
  const overlayElements = document.querySelectorAll('[class*="overlay"], [class*="bg-"], .hero-background');
  overlayElements.forEach(el => {
    if (!el.classList.contains('modal') && !el.classList.contains('modal-overlay')) {
      el.style.pointerEvents = 'none';
    }
  });
  console.log('[CEREBRO] Disabled pointer-events on decorative overlays');
});

// Booking Modal Handler
const bookingBtn = document.getElementById('bookingBtn');
const bookingModal = document.getElementById('bookingModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const bookingForm = document.getElementById('bookingForm');
const bookingMessage = document.getElementById('bookingMessage');

function openBookingModal() {
  let dateRange = '';
  let guestCount = '';

  try {
    console.log('[CEREBRO DEBUG] openBookingModal() called');
    const dateRangeInput = document.getElementById('dateRange');
    guestCount = parseInt(document.getElementById('guestCount').value) || 2;
    dateRange = dateRangeInput ? dateRangeInput.value.trim() : '';

    console.log('[CEREBRO DEBUG] dateRangeInput:', dateRangeInput);
    console.log('[CEREBRO DEBUG] dateRange value:', dateRange);
    console.log('[CEREBRO DEBUG] guestCount value:', guestCount);

    if (!dateRange || !dateRangeInput) {
      const msg = 'Por favor selecciona fechas de check-in y check-out';
      console.error('[CEREBRO ERROR]', msg, '- dateRange:', dateRange);
      showError(msg);
      if (bookingMessage) {
        bookingMessage.textContent = msg;
        bookingMessage.classList.add('error');
        bookingMessage.style.display = 'block';
      }
      return;
    }
  } catch (err) {
    console.error('[CEREBRO EXCEPTION in validation]', err);
    showError('ERROR en validación: ' + err.message);
    return;
  }

  const dates = dateRange.split(' al ');
  const checkIn = dates[0].trim();
  const checkOut = dates[1].trim();

  // Store display dates (with safety checks)
  const checkInField = document.getElementById('bookingCheckIn');
  const checkOutField = document.getElementById('bookingCheckOut');
  const guestsField = document.getElementById('bookingGuests');

  if (checkInField) checkInField.value = checkIn;
  if (checkOutField) checkOutField.value = checkOut;
  if (guestsField) guestsField.value = guestCount;

  // Parse and store ISO dates for API
  // Handle multiple formats: "22/9/2026", "22 Sep 2026", "22 de septiembre de 2026"
  const parseESDate = (dateStr) => {
    const cleanStr = dateStr.trim();

    // Try format: day/month/year (22/9/2026)
    const slashParts = cleanStr.split('/');
    if (slashParts.length === 3) {
      const day = slashParts[0];
      const month = slashParts[1];
      const year = slashParts[2];
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Try format: day Mon year (25 Sep 2026)
    const spaceParts = cleanStr.split(' ');
    if (spaceParts.length === 3 && spaceParts[2].length === 4) {
      const day = spaceParts[0];
      const monthStr = spaceParts[1];
      const year = spaceParts[2];
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
        'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Ago': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
      };
      const month = monthMap[monthStr];
      if (month) {
        return `${year}-${month}-${String(day).padStart(2, '0')}`;
      }
    }

    return '';
  };

  try {
    const checkInISO = parseESDate(checkIn);
    const checkOutISO = parseESDate(checkOut);

    console.log('[CEREBRO DEBUG] Parsed dates - checkIn:', checkInISO, 'checkOut:', checkOutISO);
    console.log('[CEREBRO DEBUG] bookingModal element:', bookingModal);
    console.log('[CEREBRO DEBUG] bookingModal current classes:', bookingModal?.className);

    // Safely set ISO date fields if they exist
    const checkInISOField = document.getElementById('bookingCheckInISO');
    const checkOutISOField = document.getElementById('bookingCheckOutISO');
    if (checkInISOField) checkInISOField.value = checkInISO;
    if (checkOutISOField) checkOutISOField.value = checkOutISO;

    if (!bookingModal) {
      console.error('[CEREBRO ERROR] bookingModal is null or undefined!');
      showError('ERROR: No se encontró el modal de formulario');
      if (bookingMessage) {
        bookingMessage.textContent = 'Error: Modal no encontrado';
        bookingMessage.classList.add('error');
        bookingMessage.style.display = 'block';
      }
      return;
    }

    console.log('[CEREBRO DEBUG] Removing "hidden" class from modal...');
    bookingModal.classList.remove('hidden');
    console.log('[CEREBRO DEBUG] Modal classes after remove:', bookingModal.className);
    console.log('[CEREBRO DEBUG] Modal display style:', window.getComputedStyle(bookingModal).display);

  } catch (err) {
    console.error('[CEREBRO EXCEPTION in modal opening]', err);
    showError('ERROR al abrir modal: ' + err.message);
  }
}

function closeBookingModal() {
  bookingModal.classList.add('hidden');
  bookingForm.reset();
  bookingMessage.textContent = '';
}

if (bookingBtn) {
  bookingBtn.addEventListener('click', openBookingModal);
  bookingBtn.addEventListener('click', openBookingModal, true);
  bookingBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); openBookingModal(); }, true);
  bookingBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); openBookingModal(); }, true);
  bookingBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); openBookingModal(); }, true);
}

if (modalClose) {
  modalClose.addEventListener('click', closeBookingModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', closeBookingModal);
}

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('bookingName').value.trim();
    const email = document.getElementById('bookingEmail').value.trim();
    const phone = document.getElementById('bookingPhone').value.trim();
    const checkIn = document.getElementById('bookingCheckIn').value;
    const checkOut = document.getElementById('bookingCheckOut').value;
    const guests = parseInt(document.getElementById('bookingGuests').value);
    const ageConfirmed = document.getElementById('bookingAge').checked;

    if (!name || !email || !phone) {
      bookingMessage.textContent = '❌ Please complete all fields';
      bookingMessage.classList.add('error');
      return;
    }

    if (!ageConfirmed) {
      bookingMessage.textContent = '❌ You must confirm you are 25 years old or older';
      bookingMessage.classList.add('error');
      return;
    }

    // Define submitBtn outside try so it's always accessible
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    if (!submitBtn) {
      console.error('[BOOKING ERROR] Submit button not found');
      bookingMessage.textContent = '❌ Error: Submit button not found';
      bookingMessage.classList.add('error');
      return;
    }

    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Sending...';

      // Use ISO dates from hidden fields
      let checkInDate = document.getElementById('bookingCheckInISO').value;
      let checkOutDate = document.getElementById('bookingCheckOutISO').value;

      // Fallback: parse from display dates if ISO fields are empty
      if (!checkInDate || !checkOutDate) {
        console.warn('ISO dates not found, parsing from display dates');
        const parseESDate = (dateStr) => {
          const cleanStr = dateStr.replace(/\s+de\s+/g, ' ').trim();
          const parts = cleanStr.split('/');
          if (parts.length === 3) {
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
          return '';
        };
        checkInDate = checkInDate || parseESDate(checkIn);
        checkOutDate = checkOutDate || parseESDate(checkOut);
      }

      const bookingUrl = API_BASE_URL + '/api/bookings';
      console.log('[BOOKING] Starting fetch to', bookingUrl);
      console.log('[BOOKING] API_BASE_URL:', API_BASE_URL);
      console.log('[BOOKING] window.location.origin:', window.location.origin);
      console.log('[BOOKING] Device info - User-Agent:', navigator.userAgent);
      console.log('[BOOKING] Device info - Viewport:', window.innerWidth, 'x', window.innerHeight);
      console.log('[BOOKING] Device info - Platform:', navigator.platform);
      console.log('[BOOKING] Network info - Effective Type:', navigator.connection?.effectiveType || 'unknown');
      console.log('[BOOKING] Network info - Online:', navigator.onLine);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[BOOKING] Timeout (90s) - aborting');
        controller.abort();
      }, 90000);

      let response;
      try {
        const bookingBody = {
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          check_in: checkInDate,
          check_out: checkOutDate,
          guest_count: guests,
          age_confirmed: ageConfirmed
        };
        const bodyStr = JSON.stringify(bookingBody);

        console.log('[BOOKING] Request body size:', bodyStr.length, 'bytes');
        console.log('[BOOKING] Sending POST request to:', bookingUrl);
        response = await fetch(bookingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: bodyStr,
          signal: controller.signal
        });
        console.log('[BOOKING] Response received:', response.status, response.statusText);
        console.log('[BOOKING] Response headers - Content-Type:', response.headers.get('Content-Type'));
      } catch (fetchErr) {
        console.error('[BOOKING] Fetch error:', fetchErr.message);
        clearTimeout(timeoutId);
        throw fetchErr;
      }

      clearTimeout(timeoutId);

      console.log('[BOOKING] Parsing JSON response...');
      let data = {};
      try {
        const responseText = await response.text();
        console.log('[BOOKING] Raw response text (first 500 chars):', responseText.substring(0, 500));
        console.log('[BOOKING] Response length:', responseText.length);

        // Try to parse as JSON
        data = JSON.parse(responseText);
        console.log('[BOOKING] JSON parsed:', data);
      } catch (jsonErr) {
        console.error('[BOOKING] JSON parse error:', jsonErr.message);
        console.error('[BOOKING] Response status:', response.status);
        console.error('[BOOKING] Response headers:', {
          'content-type': response.headers.get('Content-Type'),
          'content-length': response.headers.get('Content-Length')
        });
        data = { error: 'Invalid response from server' };
        addDebugLog(`[BOOKING ERROR] JSON parse failed - ${jsonErr.message}`, 'error');
        showDebugPanel();
      }

      if (response.ok && data.success) {
        // Stripe checkout URL should always be present on success
        if (data.checkout_url) {
          bookingMessage.textContent = '✅ Redirecting to payment...';
          bookingMessage.classList.remove('error');
          bookingMessage.classList.add('success');
          addDebugLog('[BOOKING] Redirecting to Stripe checkout', 'info');
          console.log('[BOOKING] Redirecting to:', data.checkout_url);

          // iOS/Safari fix: Do NOT use setTimeout for navigation
          // setTimeout creates an async context that Safari blocks for security
          // Use window.location.replace directly instead
          // Fallback to href if replace fails
          try {
            window.location.replace(data.checkout_url);
          } catch (navError) {
            console.warn('[BOOKING] location.replace failed, trying href:', navError.message);
            window.location.href = data.checkout_url;
          }
        } else {
          // This shouldn't happen if backend is fixed, but handle gracefully
          console.warn('[BOOKING WARNING] No checkout_url returned even though success is true');
          bookingMessage.textContent = '✅ Booking sent! We will contact you soon.';
          bookingMessage.classList.remove('error');
          bookingMessage.classList.add('success');
          addDebugLog('[BOOKING] Booking created but no payment URL', 'warning');
          setTimeout(() => {
            closeBookingModal();
          }, 2000);
        }
      } else {
        // Error case - payment setup or validation failed
        const errorMsg = data.error || data.stripe_error || 'Error sending booking';
        console.error('[BOOKING] Error response:', errorMsg);
        bookingMessage.textContent = `❌ ${errorMsg}`;
        bookingMessage.classList.add('error');
        addDebugLog(`[BOOKING ERROR] ${errorMsg}`, 'error');
      }
    } catch (err) {
      console.error('[BOOKING ERROR] Full error:', err);
      console.error('[BOOKING ERROR] Error name:', err.name);
      console.error('[BOOKING ERROR] Error message:', err.message);
      console.error('[BOOKING ERROR] Error stack:', err.stack);

      let errorMsg = 'Connection error. Try again later.';
      if (err.name === 'AbortError') {
        errorMsg = 'Request timeout - connection slow. Try again.';
      } else if (err instanceof TypeError) {
        errorMsg = 'Network error. Check your internet connection.';
      }

      bookingMessage.textContent = `❌ ${errorMsg}`;
      bookingMessage.classList.add('error');
      addDebugLog(`[BOOKING ERROR] ${errorMsg}`, 'error');
      showDebugPanel();
    } finally {
      // ALWAYS reset button, even if there's an error
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      console.log('[BOOKING] Button reset - disabled:', submitBtn.disabled, 'text:', submitBtn.textContent);
    }
  });
}

// Gallery Modal
const galleryImages = [
  '/img/sala-1.jpg',
  '/img/sala-2.jpg',
  '/img/sala-3.jpg',
  '/img/habitacion-2.jpg',
  '/img/jacuzzi.jpg',
  '/img/golf-cart.jpg',
  '/img/bed.jpg',
  '/img/cocina-1.jpg',
  '/img/cocina-2.jpg',
  '/img/gallery-extra-1.jpg',
  '/img/gallery-extra-2.jpg',
  '/img/gallery-extra-3.jpg',
  '/img/gallery-extra-4.jpg',
  '/img/gallery-extra-5.jpg',
  '/img/gallery-extra-6.jpg',
  '/img/gallery-extra-7.jpg',
  '/img/gallery-extra-8.jpg',
  '/img/gallery-extra-9.jpg',
  '/img/gallery-extra-10.jpg',
  '/img/gallery-extra-11.jpg',
  '/img/gallery-extra-12.jpg',
  '/img/gallery-extra-13.jpg',
  '/img/gallery-extra-14.jpg',
  '/img/gallery-extra-15.jpg',
  '/img/gallery-extra-16.jpg',
  '/img/gallery-extra-17.jpg',
  '/img/gallery-extra-18.jpg',
  '/img/gallery-extra-19.jpg',
  '/img/gallery-extra-20.jpg',
  '/img/gallery-extra-21.jpg',
  '/img/gallery-extra-22.jpg',
  '/img/gallery-extra-23.jpg',
  '/img/gallery-extra-24.jpg',
  '/img/gallery-extra-25.jpg',
  '/img/gallery-extra-26.jpg',
  '/img/gallery-extra-27.jpg',
  '/img/gallery-extra-28.jpg',
  '/img/gallery-extra-29.jpg',
  '/img/gallery-extra-30.jpg',
  '/img/gallery-extra-31.jpg',
  '/img/gallery-extra-32.jpg',
  '/img/gallery-extra-33.jpg',
  '/img/gallery-extra-34.jpg',
  '/img/gallery-extra-35.jpg',
  '/img/gallery-extra-36.jpg'
];

let currentImageIndex = 0;

function initGalleryModal() {
  console.log('[GALLERY DEBUG] initGalleryModal() called');
  const openBtn = document.getElementById('openGalleryBtn');
  const modal = document.getElementById('galleryModal');
  const closeBtn = document.getElementById('galleryModalClose');
  const overlay = document.getElementById('galleryModalOverlay');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  const galleryImg = document.getElementById('galleryCarouselImg');
  const counter = document.getElementById('galleryCounter');
  const total = document.getElementById('galleryTotal');

  console.log('[GALLERY DEBUG] Elements found:', {
    openBtn: !!openBtn,
    modal: !!modal,
    closeBtn: !!closeBtn,
    overlay: !!overlay,
    prevBtn: !!prevBtn,
    nextBtn: !!nextBtn,
    galleryImg: !!galleryImg,
    counter: !!counter,
    total: !!total
  });

  if (openBtn) {
    console.log('[GALLERY DEBUG] openBtn computed styles:', {
      display: window.getComputedStyle(openBtn).display,
      visibility: window.getComputedStyle(openBtn).visibility,
      pointerEvents: window.getComputedStyle(openBtn).pointerEvents,
      zIndex: window.getComputedStyle(openBtn).zIndex,
      cursor: window.getComputedStyle(openBtn).cursor
    });
  }

  if (!openBtn) {
    console.error('[GALLERY ERROR] openBtn not found - aborting initialization');
    return;
  }

  if (!modal || !total) {
    console.error('[GALLERY ERROR] Critical elements missing', { modal: !!modal, total: !!total });
    return;
  }

  total.textContent = galleryImages.length;
  console.log('[GALLERY DEBUG] Total images set to:', galleryImages.length);

  const openGallery = () => {
    console.log('[GALLERY DEBUG] openGallery() called');
    const infoPanel = document.getElementById('infoPanel');
    const infoPanelToggle = document.getElementById('infoPanelToggle');
    if (infoPanel && infoPanel.classList.contains('is-open')) {
      infoPanel.classList.remove('is-open');
      if (infoPanelToggle) infoPanelToggle.setAttribute('aria-expanded', 'false');
    }
    console.log('[GALLERY DEBUG] modal:', modal);

    // iOS Safari fix: Remove hidden class BEFORE adding active
    if (modal.classList.contains('hidden')) {
      modal.classList.remove('hidden');
    }

    // Force layout recalculation
    void modal.offsetHeight;

    modal.classList.add('active');
    currentImageIndex = 0;
    updateImage();
    document.body.style.overflow = 'hidden';
    console.log('[GALLERY DEBUG] Modal opened successfully');
  };

  console.log('[GALLERY DEBUG] Adding event listeners to button');

  // Primary handler: touchend (iOS) + click (desktop)
  const handleOpen = (e) => {
    console.log('[GALLERY DEBUG] Event fired:', { type: e.type, isTrusted: e.isTrusted });
    e.preventDefault();
    e.stopPropagation();
    openGallery();
    return false;
  };

  // iOS prefers touchend over click
  openBtn.addEventListener('touchend', handleOpen, false);

  // Desktop fallback
  openBtn.addEventListener('click', handleOpen, false);

  // Pointer events for hybrid devices
  openBtn.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') {
      console.log('[GALLERY DEBUG] POINTERUP event fired', { pointerType: e.pointerType });
      e.preventDefault();
      e.stopPropagation();
      openGallery();
    }
  }, false);

  // Ensure button is always accessible
  openBtn.style.pointerEvents = 'auto';
  openBtn.style.touchAction = 'manipulation';

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  function closeModal() {
    console.log('[GALLERY DEBUG] closeModal() called');
    modal.classList.remove('active');
    // iOS Safari fix: Add hidden class with delay to allow opacity transition
    setTimeout(() => {
      modal.classList.add('hidden');
      console.log('[GALLERY DEBUG] Modal hidden after transition');
    }, 300);
    document.body.style.overflow = '';
  }

  prevBtn.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    updateImage();
  });

  nextBtn.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    updateImage();
  });

  function updateImage() {
    galleryImg.src = galleryImages[currentImageIndex];
    counter.textContent = currentImageIndex + 1;
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === 'Escape') closeModal();
  });

  console.log('[GALLERY DEBUG] initGalleryModal() completed successfully');
}

// DEBUG PANEL: Show logs on page for mobile debugging
const debugLogs = [];
const originalLog = console.log;
const originalError = console.error;

function addDebugLog(msg, type = 'log') {
  debugLogs.push({ msg, type, time: new Date().toLocaleTimeString() });
  if (debugLogs.length > 50) debugLogs.shift();

  // Also show in browser console
  if (type === 'error') {
    originalError(msg);
  } else {
    originalLog(msg);
  }
}

// Override console.log for debug messages
console.log = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('[GALLERY') || msg.includes('[BOOKING')) {
    addDebugLog(msg, 'log');
  }
  originalLog.apply(console, args);
};

console.error = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('[GALLERY') || msg.includes('[BOOKING')) {
    addDebugLog(msg, 'error');
  }
  originalError.apply(console, args);
};

// Create debug panel
function createDebugPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    width: 280px;
    max-height: 200px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid #5B9CA6;
    border-radius: 8px;
    padding: 10px;
    font-family: monospace;
    font-size: 10px;
    color: #0f0;
    overflow-y: auto;
    z-index: 99999;
    display: none;
  `;

  document.body.appendChild(panel);

  return panel;
}

const debugPanel = createDebugPanel();

// Show debug panel only when there are errors
function showDebugPanel() {
  const hasErrors = debugLogs.some(log => log.type === 'error');
  if (hasErrors) {
    debugPanel.style.display = 'block';
    debugPanel.innerHTML = debugLogs.map(log =>
      `<div style="color: ${log.type === 'error' ? '#f00' : '#0f0'}">${log.time}: ${log.msg}</div>`
    ).join('');
    debugPanel.scrollTop = debugPanel.scrollHeight;
  } else {
    debugPanel.style.display = 'none';
  }
}

// Inicializar galería modal (ANTIGUA - MANTENER SIN CAMBIOS)
// DESHABILITADO: Gallery modal legacy code (replaced with expandable gallery)
// console.log('[GALLERY DEBUG] Document readyState:', document.readyState);
// if (document.readyState === 'loading') {
//   console.log('[GALLERY DEBUG] DOM still loading, waiting for DOMContentLoaded');
//   document.addEventListener('DOMContentLoaded', initGalleryModal);
// } else {
//   console.log('[GALLERY DEBUG] DOM already loaded, calling initGalleryModal immediately');
//   initGalleryModal();
// }

// ============================================
// NUEVA GALERÍA EXPANDIBLE (FUNCIONA EN SAFARI)
// ============================================

const galleryExpandBtn = document.getElementById('openGalleryBtn');
const galleryExpandedSection = document.getElementById('galleryExpanded');
const galleryCloseBtn = document.getElementById('closeGalleryBtn');
const photoOverlay = document.getElementById('photoOverlay');
const photoOverlayClose = document.getElementById('photoOverlayClose');
const overlayImg = document.getElementById('overlayImg');
const galleryGrid = document.getElementById('galleryGrid');

// Todas las imágenes de la galería
const allGalleryImages = [
  '/img/sala-1.jpg', '/img/sala-2.jpg', '/img/sala-3.jpg', '/img/sala-4.jpg',
  '/img/gallery-extra-1.jpg', '/img/gallery-extra-2.jpg', '/img/gallery-extra-3.jpg',
  '/img/gallery-extra-4.jpg', '/img/gallery-extra-5.jpg', '/img/gallery-extra-6.jpg',
  '/img/gallery-extra-7.jpg', '/img/gallery-extra-8.jpg', '/img/gallery-extra-9.jpg',
  '/img/gallery-extra-10.jpg', '/img/gallery-extra-11.jpg', '/img/gallery-extra-12.jpg',
  '/img/gallery-extra-13.jpg', '/img/gallery-extra-14.jpg', '/img/gallery-extra-15.jpg',
  '/img/gallery-extra-16.jpg', '/img/gallery-extra-17.jpg', '/img/gallery-extra-18.jpg',
  '/img/gallery-extra-19.jpg', '/img/gallery-extra-20.jpg', '/img/gallery-extra-21.jpg',
  '/img/gallery-extra-22.jpg', '/img/gallery-extra-23.jpg', '/img/gallery-extra-24.jpg',
  '/img/gallery-extra-25.jpg', '/img/gallery-extra-26.jpg', '/img/gallery-extra-27.jpg',
  '/img/gallery-extra-28.jpg', '/img/gallery-extra-29.jpg', '/img/gallery-extra-30.jpg',
  '/img/gallery-extra-31.jpg', '/img/gallery-extra-32.jpg', '/img/gallery-extra-33.jpg',
  '/img/gallery-extra-34.jpg', '/img/gallery-extra-35.jpg', '/img/gallery-extra-36.jpg'
];

function initExpandableGallery() {
  console.log('[GALLERY] Initializing expandable gallery...');
  console.log('[GALLERY] galleryExpandBtn:', galleryExpandBtn);
  console.log('[GALLERY] galleryGrid:', galleryGrid);

  if (!galleryExpandBtn || !galleryGrid || !galleryExpandedSection) {
    console.error('[GALLERY] ERROR: Required elements not found!', {
      btn: !!galleryExpandBtn,
      grid: !!galleryGrid,
      section: !!galleryExpandedSection
    });
    return;
  }

  // Get button reference directly - NO CLONING (causes issues in iPhone Safari)
  const expandBtn = document.getElementById('openGalleryBtn');
  if (!expandBtn) {
    console.error('[GALLERY] ERROR: Could not find expandBtn!');
    return;
  }

  // Limpiar grid por si acaso tiene elementos viejos
  galleryGrid.innerHTML = '';

  // Crear grid con todas las imágenes
  console.log('[GALLERY] Loading', allGalleryImages.length, 'images...');
  let loadedCount = 0;
  allGalleryImages.forEach((imgSrc, index) => {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = `Gallery photo ${index + 1}`;
    img.dataset.index = index;
    img.style.cursor = 'pointer';
    img.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPhotoOverlay(imgSrc);
    };
    galleryGrid.appendChild(img);
    loadedCount++;
  });
  console.log('[GALLERY] Loaded ' + loadedCount + ' images into grid');

  // Función para abrir galería
  const openGallery = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('[GALLERY] Opening gallery...');
    galleryExpandedSection.classList.remove('hidden');
    galleryExpandedSection.classList.add('active');
    expandBtn.style.display = 'none';
    document.body.style.overflow = 'hidden';
    console.log('[GALLERY] Gallery opened');
  };

  // Evento: Abrir galería expandida (múltiples listeners para compatibilidad iOS)
  expandBtn.addEventListener('click', openGallery);
  expandBtn.addEventListener('touchend', openGallery);
  expandBtn.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') {
      openGallery(e);
    }
  });

  // Ensure button can receive events in iOS
  expandBtn.style.pointerEvents = 'auto';
  expandBtn.style.touchAction = 'manipulation';

  // Función para cerrar galería
  const closeGallery = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('[GALLERY] Closing gallery...');
    galleryExpandedSection.classList.add('hidden');
    galleryExpandedSection.classList.remove('active');
    expandBtn.style.display = 'inline-flex';
    document.body.style.overflow = '';
    console.log('[GALLERY] Gallery closed');
  };

  // Evento: Cerrar galería expandida (múltiples listeners para compatibilidad iOS)
  galleryCloseBtn.addEventListener('click', closeGallery);
  galleryCloseBtn.addEventListener('touchend', closeGallery);
  galleryCloseBtn.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') {
      closeGallery(e);
    }
  });

  // Ensure button can receive events in iOS
  galleryCloseBtn.style.pointerEvents = 'auto';
  galleryCloseBtn.style.touchAction = 'manipulation';

  // Evento: Cerrar overlay de foto (múltiples listeners para compatibilidad iOS)
  const closePhotoHandler = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closePhotoOverlay();
  };

  photoOverlayClose.addEventListener('click', closePhotoHandler);
  photoOverlayClose.addEventListener('touchend', closePhotoHandler);
  photoOverlayClose.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') {
      closePhotoHandler(e);
    }
  });

  // Evento: Click en overlay cierra también
  photoOverlay.addEventListener('click', (e) => {
    if (e.target === photoOverlay) {
      closePhotoOverlay();
    }
  });

  // Ensure button can receive events in iOS
  photoOverlayClose.style.pointerEvents = 'auto';
  photoOverlayClose.style.touchAction = 'manipulation';
}

function openPhotoOverlay(imgSrc) {
  overlayImg.src = imgSrc;
  photoOverlay.classList.remove('hidden');
  photoOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePhotoOverlay() {
  photoOverlay.classList.add('hidden');
  photoOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Inicializar galería expandible cuando el DOM esté listo
console.log('[GALLERY] Document readyState:', document.readyState);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[GALLERY] DOMContentLoaded fired, initializing expandable gallery...');
    setTimeout(initExpandableGallery, 100); // Pequeño delay para asegurar que todos los elementos están listos
  });
} else {
  console.log('[GALLERY] DOM already loaded, initializing expandable gallery...');
  setTimeout(initExpandableGallery, 100);
}
