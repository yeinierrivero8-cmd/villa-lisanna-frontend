#!/usr/bin/env python
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, init_db

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    print("📦 Inicializando base de datos...")
    init_db(app)
    print("✅ Base de datos inicializada correctamente!")
