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

// Guest Count Selector
const guestSelector = document.getElementById('guestCount');
if (guestSelector) {
  guestSelector.addEventListener('change', (e) => {
    const selectedGuests = e.target.value;
    console.log(`✅ Guests selected: ${selectedGuests}`);
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
      const response = await fetch('/api/availability');
      if (response.ok) {
        const data = await response.json();
        occupiedDates = data.unavailable_dates || [];
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

    const guestCount = document.getElementById('guestCount').value || 2;
    const checkIn = selectedDates[0].toISOString().split('T')[0];
    const checkOut = selectedDates[1].toISOString().split('T')[0];

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in_date: checkIn,
          check_out_date: checkOut,
          guest_count: parseInt(guestCount)
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

  // Click en fotos
  lightboxEls.forEach((fig, i) => {
    fig.style.cursor = 'pointer';
    fig.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(i);
    });
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

    const guestCount = document.getElementById('guestCount')?.value || 2;
    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];

    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        check_in_date: checkInStr,
        check_out_date: checkOutStr,
        guest_count: parseInt(guestCount)
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
    const whatsappUrl = `https://wa.me/18327635760?text=${encodedMessage}`;

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

// Booking Modal Handler
const bookingBtn = document.getElementById('bookingBtn');
const bookingModal = document.getElementById('bookingModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const bookingForm = document.getElementById('bookingForm');
const bookingMessage = document.getElementById('bookingMessage');

function openBookingModal() {
  const dateRangeInput = document.getElementById('dateRange');
  const guestCount = document.getElementById('guestCount').value;
  const dateRange = dateRangeInput.value.trim();

  if (!dateRange) {
    alert('⚠️ Please select your check-in and check-out dates');
    return;
  }

  const dates = dateRange.split(' al ');
  const checkIn = dates[0].trim();
  const checkOut = dates[1].trim();

  document.getElementById('bookingCheckIn').value = checkIn;
  document.getElementById('bookingCheckOut').value = checkOut;
  document.getElementById('bookingGuests').value = guestCount;

  bookingModal.classList.remove('hidden');
}

function closeBookingModal() {
  bookingModal.classList.add('hidden');
  bookingForm.reset();
  bookingMessage.textContent = '';
}

if (bookingBtn) {
  bookingBtn.addEventListener('click', openBookingModal);
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

    try {
      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Sending...';

      // Convert dates to YYYY-MM-DD format if needed
      let checkInDate = checkIn;
      let checkOutDate = checkOut;

      // Parse dates in case they're in d M Y format
      if (!checkInDate.includes('-')) {
        const dateObj = new Date(checkInDate);
        checkInDate = dateObj.toISOString().split('T')[0];
      }
      if (!checkOutDate.includes('-')) {
        const dateObj = new Date(checkOutDate);
        checkOutDate = dateObj.toISOString().split('T')[0];
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_name: name,
          guest_email: email,
          guest_phone: phone,
          check_in: checkInDate,
          check_out: checkOutDate,
          guest_count: guests,
          age_confirmed: ageConfirmed
        })
      });

      const data = await response.json();

      if (response.ok) {
        bookingMessage.textContent = '✅ Booking sent! We will contact you soon.';
        bookingMessage.classList.remove('error');
        bookingMessage.classList.add('success');
        setTimeout(() => {
          closeBookingModal();
        }, 2000);
      } else {
        bookingMessage.textContent = `❌ ${data.error || 'Error sending booking'}`;
        bookingMessage.classList.add('error');
      }

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    } catch (err) {
      bookingMessage.textContent = '❌ Connection error. Try again later.';
      bookingMessage.classList.add('error');
      console.error('Booking error:', err);
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
  '/img/cocina-2.jpg'
];

let currentImageIndex = 0;

function initGalleryModal() {
  const openBtn = document.getElementById('openGalleryBtn');
  const modal = document.getElementById('galleryModal');
  const closeBtn = document.getElementById('galleryModalClose');
  const overlay = document.getElementById('galleryModalOverlay');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  const galleryImg = document.getElementById('galleryCarouselImg');
  const counter = document.getElementById('galleryCounter');
  const total = document.getElementById('galleryTotal');

  if (!openBtn) return;

  total.textContent = galleryImages.length;

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    modal.classList.remove('hidden');
    currentImageIndex = 0;
    updateImage();
    document.body.style.overflow = 'hidden';
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
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
}

// Inicializar galería modal
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGalleryModal);
} else {
  initGalleryModal();
}
