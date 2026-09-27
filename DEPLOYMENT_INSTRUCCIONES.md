# DEPLOYMENT INSTRUCCIONES - Fix Galería Modal en Móvil

## Problema Encontrado

**CSS Syntax Error** en `css/styles.css` línea 2992-2993:
```css
  display: none;
}  <!-- ORPHANED - Sin selector
```

Este error causa que el CSS parser falle, impidiendo que las media queries posteriores (móvil) se procesen.

## Solución Aplicada

### 1. CSS Fix (css/styles.css)
- Removido `display: none;` huérfano (línea 2992-2993)
- El CSS ahora se parsea correctamente
- Las media queries para móvil ahora se aplican

### 2. JavaScript Debug Enhancements (js/app.js)
Añadidos console.log estratégicos en la función `initGalleryModal()`:
- Verificar inicialización
- Confirmar elementos encontrados
- Loguear evento click/touchend
- Confirmar apertura del modal

## Deployment

### Opción A: Git (Recomendado)
```bash
cd /home/villa-lisanna
git pull origin main
# Commit: 8a68217 (fix(gallery): Fix gallery modal on mobile)
```

### Opción B: Manual SCP
```bash
# Copiar archivos actualizados
scp root@188.245.80.35:/home/villa-lisanna/js/app.js backup-app.js
scp root@188.245.80.35:/home/villa-lisanna/css/styles.css backup-styles.css

# Copiar nuevos archivos
scp /tmp/villa-fix-gallery.tar.gz root@188.245.80.35:/home/villa-lisanna/

# En el VPS:
cd /home/villa-lisanna
tar -xzf villa-fix-gallery.tar.gz
```

### Opción C: Netlify (Si está configurado)
- El repositorio debería auto-deployear con el nuevo commit
- Verificar en https://app.netlify.com

## Verificación en Móvil

1. Abrir www.villalisanna.com en dispositivo móvil
2. Navegar a "Explore Every Corner" / "Explora Cada Rincón"
3. Tocar botón "View Full Gallery" / "Ver Galería Completa"
4. Abrir DevTools Console (F12)
5. Buscar logs que contienen `[GALLERY DEBUG]`

### Console Logs Esperados:
```
[GALLERY DEBUG] Document readyState: interactive
[GALLERY DEBUG] DOM already loaded, calling initGalleryModal immediately
[GALLERY DEBUG] initGalleryModal() called
[GALLERY DEBUG] Elements found: {
  openBtn: true,
  modal: true,
  ...
}
[GALLERY DEBUG] Adding event listeners to button
[GALLERY DEBUG] Touchend event fired on button
[GALLERY DEBUG] openGallery() called
[GALLERY DEBUG] Modal opened successfully
```

## Troubleshooting

### Si los logs dicen "Elements not found"
- Verificar que los IDs en HTML coinciden con el JavaScript
- Verificar que app.js se está cargando después de que el DOM esté listo

### Si no se ve el modal
- Verificar z-index del modal (debería ser 1000 mínimo)
- Verificar que display: flex está activo en .gallery-modal.active
- Verificar que pointer-events está habilitado en elementos

### Si pointer-events está deshabilitado
- Verificar CSS línea 3264: `button { pointer-events: auto !important; }`
- Verificar que no hay otro CSS que sobrescribe esto

## Rollback (Si es necesario)

```bash
git revert 8a68217
# O revertir a commit anterior:
git checkout HEAD~1 -- css/styles.js js/app.js
```

## Cambios en Detalle

### css/styles.css
- **Línea 2992-2993**: Removido `display: none;` huérfano
- Resultado: CSS valido, media queries se procesan correctamente

### js/app.js
- **Línea 798-830**: Añadidos console.log extensivos
- **Línea 858-883**: Mejorado debugging de inicialización

## Próximos Pasos

1. Hacer deploy de estos cambios
2. Probar en móvil
3. Verificar console logs
4. Si funciona, remover console.log para producción
5. Re-deployer versión limpia
