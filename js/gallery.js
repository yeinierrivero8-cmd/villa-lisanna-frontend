// Generate all photo URLs
const allPhotos = [];
for (let i = 1; i <= 39; i++) {
  allPhotos.push(`/img/photo-${i}.jpg`);
}

let currentImageIndex = 0;
let touchStartX = 0;
let isDragging = false;

function initGallery() {
  const photoOverlay = document.getElementById('photoOverlay');
  const overlayImg = document.getElementById('overlayImg');
  const closeBtn = document.getElementById('photoOverlayClose');
  const galleryGrid = document.getElementById('galleryGrid');

  if (!photoOverlay || !overlayImg || !closeBtn) {
    console.error('Gallery elements not found');
    return;
  }

  // Create gallery grid with all photos
  if (galleryGrid) {
    allPhotos.forEach((photoUrl, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-grid-item';
      item.style.cursor = 'pointer';
      item.onclick = () => openGallery(index);

      const img = document.createElement('img');
      img.src = photoUrl;
      img.alt = `Photo ${index + 1}`;
      img.loading = 'lazy';

      item.appendChild(img);
      galleryGrid.appendChild(item);
    });
  }

  // Also make compact items clickable if they exist
  const compactItems = document.querySelectorAll('.gallery-compact-item');
  compactItems.forEach((item, index) => {
    item.style.cursor = 'pointer';
    item.onclick = () => openGallery(index);
  });

  function openGallery(index) {
    currentImageIndex = index;
    displayImage();
    photoOverlay.classList.remove('hidden');
    photoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function displayImage() {
    overlayImg.src = allPhotos[currentImageIndex];
  }

  function closeGallery() {
    photoOverlay.classList.add('hidden');
    photoOverlay.classList.remove('active');
    document.body.style.overflow = '';
    isDragging = false;
  }

  function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % allPhotos.length;
    displayImage();
  }

  function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + allPhotos.length) % allPhotos.length;
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

  console.log('Gallery initialized with ' + allPhotos.length + ' photos');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
