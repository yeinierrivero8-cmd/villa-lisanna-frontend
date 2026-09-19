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

  // Cerrar el panel si se hace click fuera
  document.addEventListener('click', (e) => {
    if (!infoPanel.contains(e.target) && e.target !== infoPanelToggle) {
      infoPanel.classList.remove('is-open');
      infoPanelToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Guest Count Selector
const guestSelector = document.getElementById('guestCount');
if (guestSelector) {
  guestSelector.addEventListener('change', (e) => {
    const selectedGuests = e.target.value;
    console.log(`✅ Huéspedes seleccionados: ${selectedGuests} ${selectedGuests == 1 ? 'persona' : 'personas'}`);
  });
}

// Calendario Flatpickr - Configuración de disponibilidad
if (typeof flatpickr !== 'undefined') {
  // Fechas ocupadas (ejemplo - puedes cambiar estas fechas)
  const occupiedDates = [
    '2026-09-15',
    '2026-09-16',
    '2026-09-17',
    '2026-09-22',
    '2026-09-23',
    '2026-10-05',
    '2026-10-06',
    '2026-10-07',
    '2026-10-15',
    '2026-10-16',
  ];

  flatpickr('#dateRange', {
    mode: 'range',
    minDate: 'today',
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
      }
    }
  });
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
const lightboxEls = Array.from(document.querySelectorAll('[data-lightbox]'));
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
let currentIndex = 0;

function openLightbox(index) {
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

lightboxEls.forEach((fig, i) => {
  fig.addEventListener('click', () => openLightbox(i));
  fig.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(i);
    }
  });
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', () => openLightbox(currentIndex - 1));
document.getElementById('lightboxNext').addEventListener('click', () => openLightbox(currentIndex + 1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
  if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
});

// Contact form
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const mensaje = document.getElementById('mensaje').value.trim();

  // Validation
  if (nombre.length < 3) {
    showMessage('Por favor ingresa tu nombre completo', 'error');
    return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    showMessage('Por favor ingresa un email válido', 'error');
    return;
  }
  if (telefono.replace(/\D/g, '').length < 7) {
    showMessage('Por favor ingresa un teléfono válido', 'error');
    return;
  }

  try {
    const btn = contactForm.querySelector('.btn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ Enviando...';

    // Simulated submission (replace with real API later)
    await new Promise(resolve => setTimeout(resolve, 1000));

    showMessage('✅ ¡Gracias! Tu mensaje ha sido enviado. Nos pondremos en contacto pronto.', 'success');
    contactForm.reset();
    btn.textContent = originalText;
    btn.disabled = false;

  } catch (err) {
    showMessage('❌ Error al enviar. Intenta más tarde.', 'error');
  }
});

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
