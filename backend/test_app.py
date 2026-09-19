#!/usr/bin/env python
import os
import sys

print("▶ Probando importaciones...")

try:
    from app import create_app, init_db
    print("✅ App factory e init_db importadas correctamente")

    app = create_app('development')
    print("✅ Flask app creada exitosamente")

    init_db(app)
    print("✅ Base de datos inicializada")

    with app.app_context():
        from app.models import AdminUser, Booking, BlockedDate, Inquiry, PricingConfig
        print("✅ Todos los modelos cargados correctamente")

        from app.services.pricing import PricingService
        from app.services.email_service import EmailService
        from app.services.stripe_service import StripeService
        print("✅ Todos los servicios cargados correctamente")

        from app.routes.public_api import api
        from app.routes.stripe_webhook import webhook
        from app.routes.admin import admin
        print("✅ Todos los blueprints cargados correctamente")

    print("\n🎉 Toda la aplicación está funcionando sin errores!")

except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
