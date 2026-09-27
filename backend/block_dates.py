#!/usr/bin/env python
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import BlockedDate

app = create_app(os.getenv('FLASK_ENV', 'development'))

with app.app_context():
    # Dates to block in October 2026
    date_ranges = [
        (3, 6),    # Oct 3-6
        (9, 11),   # Oct 9-11
        (16, 19)   # Oct 16-19
    ]

    blocked_dates = []

    for start, end in date_ranges:
        for day in range(start, end + 1):
            blocked_date = date(2026, 10, day)

            # Check if already blocked
            existing = BlockedDate.query.filter_by(date=blocked_date).first()
            if not existing:
                bd = BlockedDate(date=blocked_date)
                db.session.add(bd)
                blocked_dates.append(blocked_date)
                print("[OK] Blocked: " + str(blocked_date))
            else:
                print("[SKIP] Already blocked: " + str(blocked_date))

    db.session.commit()
    print("\n[SUCCESS] Total dates blocked: " + str(len(blocked_dates)))
