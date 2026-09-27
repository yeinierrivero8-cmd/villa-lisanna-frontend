# Cómo Usar test_smtp_diagnostic.py

## Descripción

Script Python que prueba diferentes configuraciones SMTP para encontrar cuál funciona en tu VPS.

Prueba automáticamente:
- ✓ Namecheap Puerto 465 (SSL) - actual (probablemente falla)
- ✓ Namecheap Puerto 587 (STARTTLS) - alternativa recomendada
- ✓ Namecheap Puerto 25 (Plain) - si todo lo demás falla
- ✓ SendGrid - si Namecheap no funciona
- ✓ Gmail - si necesitas algo simple

## Requisitos

- Python 3.6+
- Acceso SSH a VPS
- Credenciales SMTP válidas

## Pasos

### 1. Conectar a VPS

```bash
ssh -i ~/.ssh/hetzner_key root@188.245.80.35
```

### 2. Copiar script a VPS

Desde tu máquina local:
```bash
scp -i ~/.ssh/hetzner_key test_smtp_diagnostic.py root@188.245.80.35:/tmp/
```

O crear el archivo directamente en VPS:
```bash
ssh -i ~/.ssh/hetzner_key root@188.245.80.35
cat > /tmp/test_smtp_diagnostic.py << 'EOF'
# (pegar contenido del script aquí)
EOF
```

### 3. Ejecutar script

En la sesión SSH:

```bash
cd /tmp
python3 test_smtp_diagnostic.py
```

### 4. Proporcionar credenciales

El script pedirá:

```
SMTP Username (e.g admin@villalisanna.com): admin@villalisanna.com
SMTP Password: QbWb-FkHG-bki2-aQQy-szzy-bKpT
```

### 5. Interpretar resultados

El script probará cada configuración automáticamente y se detendrá cuando encuentre una que funcione.

#### Resultado EXITOSO:
```
============================================================
Testing: Namecheap Private Email - STARTTLS (Port 587)
Server: mail.privateemail.com:587
User: admin@villalisanna.com
============================================================

[HH:MM:SS] ℹ Attempting connection to mail.privateemail.com:587
[HH:MM:SS] ✓ Connection established
[HH:MM:SS] ℹ Starting STARTTLS
[HH:MM:SS] ✓ STARTTLS completed
[HH:MM:SS] ℹ Attempting login as admin@villalisanna.com
[HH:MM:SS] ✓ Login successful
[HH:MM:SS] ℹ Preparing test email
[HH:MM:SS] ℹ Sending test email
[HH:MM:SS] ✓ Test email sent successfully

✓ Found working configuration!

============================================================
DIAGNOSTIC SUMMARY
============================================================

✓ Namecheap Private Email - STARTTLS (Port 587): SUCCESS

WORKING CONFIGURATIONS:
  - Namecheap Private Email - STARTTLS (Port 587) (mail.privateemail.com:587)

Update your .env to use one of these configs
```

**Acción:** Copiar la configuración sugerida a tu `.env`

#### Resultado FALLO:
```
[HH:MM:SS] ✗ Timeout: Connection timed out (firewall?)
```

**Acción:** Script continuará probando la siguiente configuración

---

## Qué Hacer Según Resultado

### Si Namecheap Puerto 587 FUNCIONA ✓

Actualizar `.env` en VPS:

```bash
sudo nano /var/www/villalisanna/.env
```

Cambiar:
```bash
SMTP_SERVER=mail.privateemail.com
SMTP_PORT=587  # ← Cambiar de 465 a 587
SMTP_USER=admin@villalisanna.com
SMTP_PASSWORD=QbWb-FkHG-bki2-aQQy-szzy-bKpT
```

Reiniciar app:
```bash
pm2 restart villa-lisanna
```

---

### Si Namecheap NO FUNCIONA en Ningún Puerto ✗

Usar SendGrid (recomendado):

#### Paso 1: Crear cuenta SendGrid

1. Ir a: https://sendgrid.com/free
2. Registrarse
3. Confirmar email
4. Ir a: Settings → API Keys
5. Crear nueva API key
6. Copiar key (formato: `SG.xxxxxxxxxxxxxxxxxxxxxxxx`)

#### Paso 2: Actualizar .env

```bash
sudo nano /var/www/villalisanna/.env
```

Cambiar:
```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM_EMAIL=noreply@villalisanna.com
```

#### Paso 3: Reiniciar app

```bash
pm2 restart villa-lisanna
```

#### Paso 4: Verificar en script

Ejecutar script de nuevo, pero ingresar:
```
SMTP Username: apikey
SMTP Password: SG.xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Troubleshooting

### Script dice "Timeout"
**Causa:** Firewall bloqueando puerto  
**Solución:** Probar puerto 587 en lugar de 465

### "Authentication failed"
**Causa:** Contraseña incorrecta o usuario no existe  
**Solución:** 
- Verificar contraseña en Namecheap panel
- Verificar que usuario está configurado en Private Email
- Si es SendGrid, usar `username=apikey` exactamente

### Script se cuelga en STARTTLS
**Causa:** Servidor requiere conexión directa SSL  
**Solución:** Cambiar a puerto 465 con SMTP_SSL

---

## Test Manual (si no quieres usar script)

### Prueba rápida de conectividad:

```bash
# Verificar que servidor responde (puerto 587)
nc -zv mail.privateemail.com 587

# Resultado esperado:
# mail.privateemail.com [198.54.122.135] 587 (?) open
```

### Test de SMTP con Python directo:

```bash
python3 << 'EOF'
import smtplib
import ssl

# Configuración
server = 'mail.privateemail.com'
port = 587
user = 'admin@villalisanna.com'
password = 'QbWb-FkHG-bki2-aQQy-szzy-bKpT'

# Intentar conectar
try:
    smtp = smtplib.SMTP(server, port, timeout=10)
    print("✓ Connection OK")
    
    smtp.starttls()
    print("✓ STARTTLS OK")
    
    smtp.login(user, password)
    print("✓ Login OK")
    
    smtp.quit()
    print("✓ Configuration works!")
except Exception as e:
    print(f"✗ Error: {e}")
EOF
```

---

## Logs en Producción

Después de hacer cambios, verificar logs:

```bash
# Ver logs en vivo
tail -f /root/.pm2/logs/villa-lisanna-out.log

# Buscar errores SMTP
grep -i smtp /root/.pm2/logs/villa-lisanna-out.log | tail -20
```

Resultado esperado después de crear booking:
```
[DEBUG] send_email() iniciado para: admin@villalisanna.com
[DEBUG] Usando SMTP + STARTTLS (puerto 587)
[DEBUG] Conexión SMTP establecida
[DEBUG] STARTTLS completado
[DEBUG] Login exitoso
[DEBUG] Mensaje enviado
[SUCCESS] Email enviado exitosamente a admin@villalisanna.com
```

---

## Resumen

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Copiar script a VPS | 1 min |
| 2 | Ejecutar script | 3 min |
| 3 | Actualizar .env | 2 min |
| 4 | Reiniciar app | 1 min |
| 5 | Testear con booking nuevo | 5 min |
| **Total** | | **12 min** |

---

## Próximos Pasos

1. ✅ Ejecutar diagnostic
2. ✅ Encontrar configuración que funciona
3. ✅ Actualizar .env
4. ✅ Reiniciar app
5. ✅ Crear booking de test → verificar email recibido
6. ✅ Re-test flujo completo (QR → pago)

---

**Archivo generado:** 2026-09-25  
**Para:** Villa Lisanna QR System Deployment  
**Contacto:** Liset (admin@villalisanna.com)
