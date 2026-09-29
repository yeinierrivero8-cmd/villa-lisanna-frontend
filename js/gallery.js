// Simple Gallery - Click any of the 4 compact photos to view full gallery

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

function initGallery() {
  const photoOverlay = document.getElementById('photoOverlay');
  const overlayImg = document.getElementById('overlayImg');
  const closeBtn = document.getElementById('photoOverlayClose');

  if (!photoOverlay || !overlayImg || !closeBtn) {
    console.error('Gallery elements not found');
    return;
  }

  // Make the 4 compact gallery items clickable (register on both item and image)
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
      console.log('Gallery opened at image ' + (index + 1));
    };

    // Register on the item container for better iOS compatibility
    item.style.cursor = 'pointer';
    item.addEventListener('click', openGallery, false);
    item.addEventListener('touchend', openGallery, false);

    item.style.pointerEvents = 'auto';
    item.style.touchAction = 'manipulation';
  });

  // Display image function
  function displayImage() {
    overlayImg.src = allGalleryImages[currentImageIndex];
  }

  // Close button
  const closeGallery = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    photoOverlay.classList.add('hidden');
    photoOverlay.classList.remove('active');
    document.body.style.overflow = '';
    console.log('Gallery closed');
  };

  closeBtn.addEventListener('click', closeGallery);
  closeBtn.addEventListener('touchend', closeGallery);
  closeBtn.style.pointerEvents = 'auto';
  closeBtn.style.touchAction = 'manipulation';

  // Click on overlay background to close
  photoOverlay.addEventListener('click', (e) => {
    if (e.target === photoOverlay) {
      closeGallery();
    }
  });

  // Next image (navigate right)
  function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % allGalleryImages.length;
    displayImage();
    console.log('Next: image ' + (currentImageIndex + 1) + ' of ' + allGalleryImages.length);
  }

  // Previous image (navigate left)
  function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + allGalleryImages.length) % allGalleryImages.length;
    displayImage();
    console.log('Previous: image ' + (currentImageIndex + 1) + ' of ' + allGalleryImages.length);
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!photoOverlay.classList.contains('active')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeGallery();
  });

  // Swipe navigation for mobile
  let touchStartX = 0;
  photoOverlay.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, false);

  photoOverlay.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  }, false);

  console.log('Gallery initialized - click any of the 4 photos to view gallery');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
