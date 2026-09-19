from flask import Flask, send_from_directory
from flask_cors import CORS
from app.config import config
from app.extensions import db, login_manager
import os

def create_app(config_name='development'):
    app = Flask(__name__, static_folder='static', static_url_path='/static')

    app.config.from_object(config[config_name])

    CORS(app)

    db.init_app(app)
    login_manager.init_app(app)

    from app.routes.public_api import api
    from app.routes.stripe_webhook import webhook
    from app.routes.admin import admin

    app.register_blueprint(api)
    app.register_blueprint(webhook)
    app.register_blueprint(admin)

    @app.route('/')
    def index():
        return send_from_directory(os.path.join(os.path.dirname(__file__), '../..'), 'index.html')

    return app

def init_db(app):
    with app.app_context():
        from app.models import AdminUser, PricingConfig
        try:
            db.create_all()

            if AdminUser.query.count() == 0:
                admin = AdminUser(
                    email='admin@villalisanna.com',
                    name='Admin',
                    active=True
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                print("✅ Admin user created: admin@villalisanna.com / admin123")

            if PricingConfig.query.count() == 0:
                config_obj = PricingConfig()
                db.session.add(config_obj)
                db.session.commit()
                print("✅ Pricing config initialized")
        except Exception as e:
            print(f"⚠️  DB init warning: {str(e)}")
