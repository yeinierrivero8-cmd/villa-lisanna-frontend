from flask import Flask, send_from_directory, jsonify, request, redirect
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_limiter import RateLimitExceeded
from app.config import config
from app.extensions import db, login_manager
import os
import traceback
import secrets
import string

csrf = CSRFProtect()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

def create_app(config_name='development'):
    app = Flask(__name__, static_folder='static', static_url_path='/static')

    app.config.from_object(config[config_name])

    # CORS restringido solo para dominio autorizado
    allowed_origins = [
        "https://villalisanna.com",
        "https://www.villalisanna.com",
        "http://localhost:3000",  # desarrollo local
        "http://10.0.0.208:8000"  # red local para testing
    ]

    CORS(app,
         resources={r"/api/*": {"origins": allowed_origins}},
         supports_credentials=True,
         allow_headers=['Content-Type', 'X-CSRFToken'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    )

    # CSRF Protection - disable in testing mode for easier testing
    if app.config.get('TESTING'):
        app.config['WTF_CSRF_ENABLED'] = False

    csrf.init_app(app)

    # Rate Limiting
    limiter.init_app(app)

    # Endpoint para obtener CSRF token (necesario para POST requests)
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        from flask_wtf.csrf import generate_csrf
        return jsonify({'csrf_token': generate_csrf()})

    # Rate Limit error handler - must come before generic Exception handler
    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit_exceeded(error):
        if request.path.startswith('/api/'):
            return jsonify({
                'success': False,
                'error': 'Rate limit exceeded'
            }), 429
        raise error

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

    # Forzar HTTPS en producción (todas las rutas)
    @app.before_request
    def enforce_https():
        if app.config.get('PREFERRED_URL_SCHEME') == 'https' and not request.secure:
            # Redirigir TODAS las rutas a HTTPS en producción (previene mixed content)
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, code=301)

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

    @app.route('/robots.txt')
    def robots():
        return send_from_directory(os.path.join(os.path.dirname(__file__), '../..'), 'robots.txt',
                                  mimetype='text/plain')

    @app.route('/sitemap.xml')
    def sitemap():
        return send_from_directory(os.path.join(os.path.dirname(__file__), '../..'), 'sitemap.xml',
                                  mimetype='application/xml')

    return app

def init_db(app):
    with app.app_context():
        from app.models import AdminUser, PricingConfig, SeasonalOffer
        try:
            db.create_all()

            if AdminUser.query.count() == 0:
                # Generar contraseña admin segura aleatoriamente
                password_chars = string.ascii_letters + string.digits + "!@#$%^&*"
                admin_password = ''.join(secrets.choice(password_chars) for _ in range(16))

                admin = AdminUser(
                    email='admin@villalisanna.com',
                    name='Admin',
                    active=True
                )
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()

                # NO imprimir contraseña en stdout - guardar en archivo protegido
                try:
                    pwd_file = '/tmp/villa_lisanna_admin_password.txt'
                    with open(pwd_file, 'w') as f:
                        f.write(f"Admin Email: admin@villalisanna.com\n")
                        f.write(f"Admin Password: {admin_password}\n")
                    os.chmod(pwd_file, 0o600)
                    print(f"[OK] Admin user created: admin@villalisanna.com")
                    print(f"[IMPORTANT] Check /tmp/villa_lisanna_admin_password.txt for credentials")
                except:
                    print(f"[OK] Admin user created: admin@villalisanna.com")
                    print(f"[CRITICAL] Save password: {admin_password}")

            if PricingConfig.query.count() == 0:
                config_obj = PricingConfig()
                db.session.add(config_obj)
                db.session.commit()
                print("[OK] Pricing config initialized")
        except Exception as e:
            print(f"[WARNING] DB init warning: {str(e)}")
