import sys
sys.path.insert(0, '.')

from datetime import datetime, timedelta
from app import create_app
from app.extensions import db
from app.models import SeasonalOffer

app = create_app()

with app.app_context():
    # Crear una oferta de prueba
    today = datetime.now().date()
    offer = SeasonalOffer(
        name="☀️ Verano Especial 2026",
        start_date=today,
        end_date=today + timedelta(days=90),
        nightly_rate=399.00,
        discount_type="fixed",
        active=True
    )

    db.session.add(offer)
    db.session.commit()

    print(f"✅ Oferta creada: {offer.name}")
    print(f"   Rango: {offer.start_date} a {offer.end_date}")
    print(f"   Tarifa: ${offer.nightly_rate}")
    print(f"   ID: {offer.id}")
