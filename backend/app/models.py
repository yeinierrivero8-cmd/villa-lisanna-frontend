from datetime import datetime, timedelta
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db, login_manager

class AdminUser(UserMixin, db.Model):
    __tablename__ = 'admin_user'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<AdminUser {self.email}>'

@login_manager.user_loader
def load_user(user_id):
    return AdminUser.query.get(int(user_id))

class PricingConfig(db.Model):
    __tablename__ = 'pricing_config'

    id = db.Column(db.Integer, primary_key=True)

    # Base pricing
    nightly_rate = db.Column(db.Float, nullable=False, default=500)
    rate_2_nights = db.Column(db.Float, nullable=False, default=495)
    rate_3_nights = db.Column(db.Float, nullable=False, default=475)
    rate_4plus_nights = db.Column(db.Float, nullable=False, default=450)

    cleaning_fee = db.Column(db.Float, nullable=False, default=295)
    damage_deposit = db.Column(db.Float, nullable=False, default=500)
    sales_tax_rate = db.Column(db.Float, nullable=False, default=0.12)

    # Restrictions
    min_nights = db.Column(db.Integer, nullable=False, default=2)
    max_nights = db.Column(db.Integer, nullable=False, default=28)
    max_guests = db.Column(db.Integer, nullable=False, default=10)
    min_age = db.Column(db.Integer, nullable=False, default=25)

    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'nightly_rate': self.nightly_rate,
            'rate_2_nights': self.rate_2_nights,
            'rate_3_nights': self.rate_3_nights,
            'rate_4plus_nights': self.rate_4plus_nights,
            'cleaning_fee': self.cleaning_fee,
            'damage_deposit': self.damage_deposit,
            'sales_tax_rate': self.sales_tax_rate,
            'min_nights': self.min_nights,
            'max_nights': self.max_nights,
            'max_guests': self.max_guests,
            'min_age': self.min_age,
        }

class BlockedDate(db.Model):
    __tablename__ = 'blocked_date'

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True, index=True)
    reason = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<BlockedDate {self.date}>'

class SeasonalOffer(db.Model):
    __tablename__ = 'seasonal_offer'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    start_date = db.Column(db.Date, nullable=False, index=True)
    end_date = db.Column(db.Date, nullable=False, index=True)
    nightly_rate = db.Column(db.Float, nullable=False)
    discount_type = db.Column(db.String(20), default='fixed')
    active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<SeasonalOffer {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'nightly_rate': self.nightly_rate,
            'discount_type': self.discount_type,
            'active': self.active
        }

class Inquiry(db.Model):
    __tablename__ = 'inquiry'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<Inquiry {self.email}>'

class Booking(db.Model):
    __tablename__ = 'booking'

    id = db.Column(db.Integer, primary_key=True)
    confirmation_code = db.Column(db.String(12), unique=True, nullable=False, index=True)

    guest_name = db.Column(db.String(120), nullable=False)
    guest_email = db.Column(db.String(120), nullable=False, index=True)
    guest_phone = db.Column(db.String(20), nullable=False)
    guest_count = db.Column(db.Integer, nullable=False)
    guest_age_confirmed = db.Column(db.Boolean, default=False)

    check_in_date = db.Column(db.Date, nullable=False, index=True)
    check_out_date = db.Column(db.Date, nullable=False, index=True)
    nights = db.Column(db.Integer, nullable=False)

    subtotal = db.Column(db.Float, nullable=False)
    cleaning_fee = db.Column(db.Float, nullable=False)
    taxes = db.Column(db.Float, nullable=False)
    damage_deposit = db.Column(db.Float, nullable=False)

    deposit_amount = db.Column(db.Float, nullable=False)
    balance_amount = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)

    status = db.Column(db.String(20), default='pending', index=True)
    deposit_paid = db.Column(db.Boolean, default=False)
    balance_paid = db.Column(db.Boolean, default=False)
    damage_deposit_returned = db.Column(db.Boolean, default=False)

    stripe_deposit_session_id = db.Column(db.String(255), unique=True)
    stripe_balance_session_id = db.Column(db.String(255), unique=True)
    stripe_deposit_payment_id = db.Column(db.String(255), unique=True)
    stripe_balance_payment_id = db.Column(db.String(255), unique=True)

    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    deposit_hold_until = db.Column(db.DateTime)

    def __repr__(self):
        return f'<Booking {self.confirmation_code}>'

    def generate_confirmation_code(self):
        import secrets
        import string
        chars = string.ascii_uppercase + string.digits
        code = ''.join(secrets.choice(chars) for _ in range(12))
        self.confirmation_code = code
        return code

    def set_deposit_hold(self, hours):
        self.deposit_hold_until = datetime.utcnow() + timedelta(hours=hours)

    @property
    def is_hold_expired(self):
        if self.deposit_hold_until:
            return datetime.utcnow() > self.deposit_hold_until
        return False
