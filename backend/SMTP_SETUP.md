# Configuración SMTP - Namecheap Private Email

## 📧 Credenciales de Namecheap (cuando lleguen)

Cuando Namecheap responda tu ticket, te enviará algo como esto:

```
Mailbox: reservations@villalisanna.com
Password: [tu-contraseña]

SMTP Settings:
Host: mail.privateemail.com
Port: 587 (TLS)
Username: reservations@villalisanna.com
Password: [la-que-te-enviamos]
```

## 🔧 Actualizar tu `.env` local

**1. Copia `.env.example` → `.env`:**
```bash
cp .env.example .env
```

**2. Abre `.env` y busca la sección SMTP:**
```env
# SMTP Email Configuration (Namecheap Private Email)
SMTP_SERVER=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=reservations@villalisanna.com
SMTP_PASSWORD=your-namecheap-password-here    ← CAMBIAR AQUÍ
SMTP_FROM_EMAIL=reservations@villalisanna.com
SMTP_FROM_NAME=Villa Lisanna Reservas
```

**3. Reemplaza `your-namecheap-password-here` con la contraseña que Namecheap envía:**

Ejemplo:
```env
SMTP_PASSWORD=Abc123!@#xyz789
```

## ✅ Verificar que funciona

Una vez configurado, ejecuta en tu terminal (dentro de `E:\web de villa lisanna\backend\`):

```bash
python -c "
from app import create_app
from app.services.email_service import EmailService

app = create_app()
with app.app_context():
    result = EmailService.send_email(
        to_email='reservations@villalisanna.com',
        subject='Test Email - Villa Lisanna',
        html_content='<h1>¡Sistema de email funciona!</h1>'
    )
    print(result)
"
```

Si ves `{'success': True}`, ¡está listo! 🎉

## 📝 Notas importantes

- **No compartir el `.env`** — contiene la contraseña SMTP
- **`.env` está en `.gitignore`** — no se subirá a Git
- **Puerto 587 = TLS** — es el correcto para Namecheap
- **Username y SMTP_FROM_EMAIL deben ser iguales** — ambos `reservations@villalisanna.com`

## 🔐 Para producción (VPS 188.245.80.35)

Cuando subas a producción, copia el `.env` con las credenciales reales al servidor:
```bash
scp .env root@188.245.80.35:/path/to/web-de-villa-lisanna/backend/
```

---

**Próximos pasos después de SMTP:**
1. Stripe: reemplazar test keys con LIVE keys
2. Admin panel: configurar usuario + contraseña
3. Deployment: llevar a producción en 188.245.80.35
