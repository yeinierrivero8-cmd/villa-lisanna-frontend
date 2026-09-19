# Villa Lisanna - Backend Flask

Sistema de reservas profesional para Villa Lisanna Gasparilla Island, Florida.

## Instalación

### 1. Crear ambiente virtual (ya creado)
```bash
python -m venv venv
```

### 2. Activar ambiente virtual
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar .env con tus credenciales reales
```

## Ejecutar el servidor

### Iniciar la aplicación Flask
```bash
python run.py
```

El servidor estará disponible en:
- **API Base**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin/login
- **Credentials de Demo**: admin@villalisanna.com / admin123

## Estructura del Proyecto

```
backend/
├── app/
│   ├── __init__.py          # App factory
│   ├── config.py            # Configuración
│   ├── extensions.py        # SQLAlchemy, Flask-Login
│   ├── models.py            # Modelos de BD
│   ├── routes/
│   │   ├── public_api.py    # API endpoints públicos
│   │   ├── stripe_webhook.py# Webhooks de Stripe
│   │   └── admin.py         # Panel de administración
│   ├── services/
│   │   ├── pricing.py       # Cálculo de precios
│   │   ├── email_service.py # Envío de emails
│   │   └── stripe_service.py# Integración Stripe
│   └── templates/
│       ├── admin/           # Templates del admin panel
│       └── emails/          # Templates de emails
├── run.py                   # Punto de entrada
├── init_database.py         # Script inicialización BD
├── requirements.txt         # Dependencias Python
├── .env.example             # Template de env vars
└── instance/                # Carpeta de BD (gitignored)
```

## Endpoints API

### Disponibilidad
- `GET /api/availability` - Obtiene fechas no disponibles

### Cotización
- `POST /api/quote` - Calcula precio de una reserva
  ```json
  {
    "check_in": "2026-12-01",
    "check_out": "2026-12-15",
    "guest_count": 4
  }
  ```

### Reservas
- `POST /api/bookings` - Crea nueva solicitud de reserva
  ```json
  {
    "guest_name": "John Doe",
    "guest_email": "john@example.com",
    "guest_phone": "+1234567890",
    "check_in": "2026-12-01",
    "check_out": "2026-12-15",
    "guest_count": 4,
    "age_confirmed": true
  }
  ```
- `GET /api/bookings/<code>/status` - Estado de una reserva

### Inquiries (Contacto)
- `POST /api/inquiries` - Crea nueva consulta

## Panel de Administración

Accesible en `/admin/login`

**Credenciales por defecto:**
- Email: admin@villalisanna.com
- Contraseña: admin123

### Funcionalidades:
- ✅ Dashboard con estadísticas
- ✅ Gestión de reservas (aprobar/rechazar)
- ✅ Configuración de precios
- ✅ Calendario de disponibilidad
- ✅ Historial de transacciones

## Variables de Entorno (.env)

```
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=cambiar-en-produccion

# Stripe (TEST mode)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# SMTP (Email)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
SMTP_FROM_EMAIL=reservas@villalisanna.com

# Villa Configuration
VILLA_OWNER_EMAIL=liset@villalisanna.com
NIGHTLY_RATE=400
CLEANING_FEE=295
DAMAGE_DEPOSIT=500
SALES_TAX_RATE=0.12
MIN_NIGHTS=3
MAX_NIGHTS=28
MAX_GUESTS=10
```

## Reglas de Negocio

- **Estadía mínima**: 3 noches
- **Estadía máxima**: 28 noches
- **Ocupación máxima**: 10 huéspedes
- **Edad mínima del responsable**: 25 años
- **Fórmula de precio**: `(nightly_rate × nights + cleaning_fee) × (1 + sales_tax_rate)`
- **Depósito**: 50% del total
- **Damage Deposit**: $500 (no gravable, reembolsable)
- **Saldo restante**: Pagable hasta 30 días antes del check-in

## Flujo de Reserva

1. Huésped selecciona fechas y cantidad de huéspedes
2. Sistema obtiene precio con `/api/quote`
3. Huésped completa datos y envía `/api/bookings`
4. Se envía email de confirmación de solicitud
5. Admin revisa en panel y aprueba
6. Se genera link de pago Stripe para depósito
7. Huésped paga depósito
8. Webhook de Stripe confirma pago
9. Reserva pasa a estado "confirmed"
10. 30 días antes check-in: se envía link de saldo
11. Post checkout: admin marca reembolso damage deposit

## Base de Datos

SQLite local (`instance/villalisanna.db`)

Tablas:
- `admin_user` - Usuarios administradores
- `booking` - Reservas
- `blocked_date` - Fechas bloqueadas
- `inquiry` - Consultas/inquiries
- `pricing_config` - Configuración de precios

## Testing

```bash
# Ejecutar tests (crear archivo test_app.py con tus tests)
python -m pytest

# O ejecutar manualmente:
python test_app.py
```

## Deployment (Próximamente)

Para production en VPS:
1. Cambiar `FLASK_ENV=production`
2. Usar credenciales reales de Stripe (LIVE mode)
3. Configurar SMTP con server de producción
4. Usar gunicorn/uWSGI en lugar de servidor de desarrollo
5. Configurar nginx como reverse proxy

## Problemas Comunes

### "unable to open database file"
Asegúrate que la carpeta `instance/` existe y tiene permisos de escritura.

### Emails no se envían
Verifica credenciales SMTP en `.env`. Para Gmail, usa contraseña de app-específica.

### Stripe errors
Asegúrate de usar TEST keys en desarrollo. Los webhooks requieren configuración en panel Stripe.

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.
