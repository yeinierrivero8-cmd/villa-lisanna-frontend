import os
import sys
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, init_db

app = create_app(os.getenv('FLASK_ENV', 'development'))
init_db(app)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 'yes')

    print(f"""
================================
  Villa Lisanna Backend Running
  Port: {port}
================================

API Base: http://localhost:{port}
Admin: http://localhost:{port}/admin/login
Availability: http://localhost:{port}/api/availability
""")

    app.run(debug=debug, host='0.0.0.0', port=port)
