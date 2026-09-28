import pytest
import json
from datetime import date, timedelta
from app import create_app
from app.extensions import db
from app.models import Booking, PricingConfig

@pytest.fixture
def app():
    """Create app instance for testing"""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        # Initialize pricing config
        if PricingConfig.query.count() == 0:
            config = PricingConfig()
            db.session.add(config)
            db.session.commit()

        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

class TestAvailabilityAPI:
    def test_get_availability_success(self, client):
        """Test getting availability returns success"""
        response = client.get('/api/availability')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'unavailable_dates' in data
        assert isinstance(data['unavailable_dates'], list)

class TestQuoteAPI:
    def test_quote_valid_dates(self, client):
        """Test quote calculation with valid dates"""
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=5)

        payload = {
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'guest_count': 2
        }

        response = client.post('/api/quote',
                              data=json.dumps(payload),
                              content_type='application/json')

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'deposit_amount' in data
        assert 'total_amount' in data
        assert data['nights'] == 5

    def test_quote_missing_dates(self, client):
        """Test quote with missing dates"""
        payload = {
            'guest_count': 2
        }

        response = client.post('/api/quote',
                              data=json.dumps(payload),
                              content_type='application/json')

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['success'] is False

    def test_quote_invalid_date_format(self, client):
        """Test quote with invalid date format"""
        payload = {
            'check_in': '2026/09/27',  # Invalid format
            'check_out': '2026-10-02',
            'guest_count': 2
        }

        response = client.post('/api/quote',
                              data=json.dumps(payload),
                              content_type='application/json')

        assert response.status_code == 400

class TestBookingAPI:
    def test_create_booking_valid(self, client):
        """Test creating a valid booking"""
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=5)

        payload = {
            'guest_name': 'John Doe',
            'guest_email': 'john@testmail.com',
            'guest_phone': '+1234567890',
            'guest_count': 2,
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'age_confirmed': True
        }

        response = client.post('/api/bookings',
                              data=json.dumps(payload),
                              content_type='application/json')

        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'booking' in data
        assert 'confirmation_code' in data['booking']

    def test_create_booking_missing_email(self, client):
        """Test booking without email"""
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=5)

        payload = {
            'guest_name': 'John Doe',
            'guest_phone': '+1234567890',
            'guest_count': 2,
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'age_confirmed': True
        }

        response = client.post('/api/bookings',
                              data=json.dumps(payload),
                              content_type='application/json')

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['success'] is False

    def test_create_booking_invalid_email(self, client):
        """Test booking with invalid email"""
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=5)

        payload = {
            'guest_name': 'John Doe',
            'guest_email': 'not-an-email',
            'guest_phone': '+1234567890',
            'guest_count': 2,
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'age_confirmed': True
        }

        response = client.post('/api/bookings',
                              data=json.dumps(payload),
                              content_type='application/json')

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['success'] is False

    def test_create_booking_too_short_stay(self, client):
        """Test booking with less than minimum nights"""
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=2)  # Only 2 nights, min is 3

        payload = {
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'guest_count': 2,
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'age_confirmed': True
        }

        response = client.post('/api/bookings',
                              data=json.dumps(payload),
                              content_type='application/json')

        # Should fail due to minimum nights requirement
        assert response.status_code == 400

class TestCSRFToken:
    def test_get_csrf_token(self, client):
        """Test getting CSRF token"""
        response = client.get('/api/csrf-token')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'csrf_token' in data
        assert len(data['csrf_token']) > 0

class TestRateLimiting:
    def test_rate_limit_booking_creation(self, client):
        """Test rate limiting on booking creation"""
        check_in = date.today() + timedelta(days=10)
        check_out = check_in + timedelta(days=5)

        payload = {
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'guest_count': 2,
            'check_in': check_in.isoformat(),
            'check_out': check_out.isoformat(),
            'age_confirmed': True
        }

        # Make 6 requests (limit is 5 per hour)
        for i in range(6):
            response = client.post('/api/bookings',
                                  data=json.dumps(payload),
                                  content_type='application/json')

            if i < 5:
                # First 5 should succeed (or fail for other reasons)
                assert response.status_code in [201, 400]
            else:
                # 6th request should be rate limited
                assert response.status_code == 429
