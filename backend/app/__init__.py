from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from app.config import config
from app.extensions import db, login_manager
import os
import traceback

def create_app(config_name='development'):
    app = Flask(__name__, static_folder='static', static_url_path='/static')

    app.config.from_object(config[config_name])

    CORS(app)

    # Global error handler for API routes - always return JSON
    @app.errorhandler(Exception)
    def handle_api_error(error):
        # Log the error with full traceback for debugging
        error_type = type(error).__name__
        print(f"[ERROR] Unhandled {error_type}: {str(error)}")
        print(f"[ERROR] Traceback:\n{traceback.format_exc()}")
        print(f"[ERROR] Request path: {request.path}")
        print(f"[ERROR] Request method: {request.method}")
        print(f"[ERROR] Request remote_addr: {request.remote_addr}")
        print(f"[ERROR] Request host_url: {request.host_url}")
        print(f"[ERROR] Request user_agent: {request.user_agent}")
        print(f"[ERROR] Content-Type: {request.content_type}")
        print(f"[ERROR] Content-Length: {request.content_length}")

        # For API routes, always return JSON
        if request.path.startswith('/api/'):
            return jsonify({
                'success': False,
                'error': f'Server error - {error_type}: {str(error)}'
            }), 500

        # For other routes, use default error handling
        raise error

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

    @app.route('/css/<path:filename>')
    def serve_css(filename):
        return send_from_directory(os.path.join(os.path.dirname(__file__), '../../css'), filename)

    @app.route('/js/<path:filename>')
    def serve_js(filename):
        return send_from_directory(os.path.join(os.path.dirname(__file__), '../../js'), filename)

    @app.route('/img/<path:filename>')
    def serve_img(filename):
        return send_from_directory(os.path.join(os.path.dirname(__file__), '../../img'), filename)

    return app

def init_db(app):
    with app.app_context():
        from app.models import AdminUser, PricingConfig, SeasonalOffer
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
                print("[OK] Admin user created: admin@villalisanna.com / admin123")

            if PricingConfig.query.count() == 0:
                config_obj = PricingConfig()
                db.session.add(config_obj)
                db.session.commit()
                print("[OK] Pricing config initialized")
        except Exception as e:
            print(f"[WARNING] DB init warning: {str(e)}")
