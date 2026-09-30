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

let currentImageIndex = 0;
let touchStartX = 0;
let isDragging = false;

function initGallery() {
  const photoOverlay = document.getElementById('photoOverlay');
  const overlayImg = document.getElementById('overlayImg');
  const closeBtn = document.getElementById('photoOverlayClose');

  if (!photoOverlay || !overlayImg || !closeBtn) {
    console.error('Gallery elements not found');
    return;
  }

  const compactItems = document.querySelectorAll('.gallery-compact-item');

  compactItems.forEach((item, index) => {
    const openGallery = (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentImageIndex = index;
      displayImage();
      photoOverlay.classList.remove('hidden');
      photoOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    item.style.cursor = 'pointer';
    item.addEventListener('click', openGallery, false);
    item.addEventListener('touchend', openGallery, false);
  });

  function displayImage() {
    overlayImg.src = allGalleryImages[currentImageIndex];
  }

  function closeGallery() {
    photoOverlay.classList.add('hidden');
    photoOverlay.classList.remove('active');
    document.body.style.overflow = '';
    isDragging = false;
  }

  function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % allGalleryImages.length;
    displayImage();
  }

  function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + allGalleryImages.length) % allGalleryImages.length;
    displayImage();
  }

  closeBtn.addEventListener('click', closeGallery);
  closeBtn.addEventListener('touchend', closeGallery);

  photoOverlay.addEventListener('click', (e) => {
    if (e.target === photoOverlay) {
      closeGallery();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!photoOverlay.classList.contains('active')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeGallery();
  });

  overlayImg.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    isDragging = true;
  }, false);

  overlayImg.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
    isDragging = false;
  }, false);

  console.log('Gallery initialized - swipe to navigate');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
