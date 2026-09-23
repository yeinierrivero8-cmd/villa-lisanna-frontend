from flask import Blueprint, request, jsonify, render_template, redirect, url_for, session, current_app
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime, date
from app.extensions import db, login_manager
from app.models import AdminUser, Booking, BlockedDate, PricingConfig, SeasonalOffer
from app.services.stripe_service import StripeService
from app.services.email_service import EmailService

admin = Blueprint('admin', __name__, url_prefix='/admin')

@admin.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json if request.is_json else request.form
        email = data.get('email')
        password = data.get('password')

        user = AdminUser.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()

            if request.is_json:
                return jsonify({'success': True, 'message': 'Login successful'})
            return redirect(url_for('admin.dashboard'))

        error_msg = 'Email o contraseña incorrectos'
        if request.is_json:
            return jsonify({'success': False, 'error': error_msg}), 401
        return render_template('admin/login.html', error=error_msg)

    return render_template('admin/login.html')

@admin.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    if request.is_json:
        return jsonify({'success': True})
    return redirect(url_for('admin.login'))

@admin.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    pending_bookings = Booking.query.filter_by(status='pending').all()
    confirmed_bookings = Booking.query.filter_by(status='confirmed').all()
    completed_bookings = Booking.query.filter_by(status='completed').all()

    stats = {
        'pending': len(pending_bookings),
        'confirmed': len(confirmed_bookings),
        'completed': len(completed_bookings),
        'total_revenue': sum(b.total_amount for b in confirmed_bookings + completed_bookings)
    }

    return render_template('admin/dashboard.html', stats=stats, bookings=pending_bookings)

@admin.route('/bookings', methods=['GET'])
@login_required
def list_bookings():
    status_filter = request.args.get('status', 'all')

    if status_filter == 'all':
        bookings = Booking.query.all()
    else:
        bookings = Booking.query.filter_by(status=status_filter).all()

    return render_template('admin/bookings_list.html', bookings=bookings)

@admin.route('/bookings/<int:booking_id>', methods=['GET'])
@login_required
def view_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    return render_template('admin/booking_detail.html', booking=booking)

@admin.route('/bookings/<int:booking_id>/approve', methods=['POST'])
@login_required
def approve_booking(booking_id):
    try:
        booking = Booking.query.get_or_404(booking_id)

        if booking.status != 'pending':
            return jsonify({'success': False, 'error': 'Booking is not pending'}), 400

        booking.status = 'approved'
        booking.approved_at = datetime.utcnow()
        booking.set_deposit_hold(current_app.config['DEPOSIT_HOLD_HOURS'])

        db.session.commit()

        data = request.json or {}
        admin_notes = data.get('notes', '')
        if admin_notes:
            booking.admin_notes = admin_notes
            db.session.commit()

        return jsonify({
            'success': True,
            'booking': {
                'id': booking.id,
                'status': booking.status,
                'approved_at': booking.approved_at.isoformat()
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/bookings/<int:booking_id>/deposit-link', methods=['POST'])
@login_required
def generate_deposit_link(booking_id):
    try:
        booking = Booking.query.get_or_404(booking_id)

        if booking.status != 'approved':
            return jsonify({'success': False, 'error': 'Booking is not approved'}), 400

        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        return_url = f"{frontend_url}/booking/{booking.confirmation_code}"

        result = StripeService.create_deposit_checkout(booking, return_url)

        if result['success']:
            db.session.commit()
            return jsonify({
                'success': True,
                'checkout_url': result['url'],
                'session_id': result['session_id']
            })
        else:
            return jsonify({'success': False, 'error': result['error']}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/bookings/<int:booking_id>/balance-link', methods=['POST'])
@login_required
def generate_balance_link(booking_id):
    try:
        booking = Booking.query.get_or_404(booking_id)

        if booking.status not in ['confirmed', 'approved']:
            return jsonify({'success': False, 'error': 'Booking is not eligible for balance payment'}), 400

        if booking.balance_paid:
            return jsonify({'success': False, 'error': 'Balance already paid'}), 400

        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        return_url = f"{frontend_url}/booking/{booking.confirmation_code}"

        result = StripeService.create_balance_checkout(booking, return_url)

        if result['success']:
            db.session.commit()
            return jsonify({
                'success': True,
                'checkout_url': result['url'],
                'session_id': result['session_id']
            })
        else:
            return jsonify({'success': False, 'error': result['error']}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/bookings/<int:booking_id>/reject', methods=['POST'])
@login_required
def reject_booking(booking_id):
    try:
        booking = Booking.query.get_or_404(booking_id)

        if booking.status != 'pending':
            return jsonify({'success': False, 'error': 'Booking is not pending'}), 400

        booking.status = 'rejected'
        db.session.commit()

        data = request.json or {}
        reason = data.get('reason', 'Su solicitud ha sido rechazada')

        EmailService.send_email(
            booking.guest_email,
            'Solicitud de Reserva Rechazada',
            f'<p>Lo sentimos, tu solicitud de reserva #{booking.confirmation_code} ha sido rechazada.</p><p>Razón: {reason}</p>'
        )

        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/pricing', methods=['GET', 'POST'])
@login_required
def manage_pricing():
    if request.method == 'POST':
        try:
            data = request.json
            config = PricingConfig.query.first()

            config.nightly_rate = float(data.get('nightly_rate', config.nightly_rate))
            config.cleaning_fee = float(data.get('cleaning_fee', config.cleaning_fee))
            config.damage_deposit = float(data.get('damage_deposit', config.damage_deposit))
            config.sales_tax_rate = float(data.get('sales_tax_rate', config.sales_tax_rate))
            config.min_nights = int(data.get('min_nights', config.min_nights))
            config.max_nights = int(data.get('max_nights', config.max_nights))
            config.max_guests = int(data.get('max_guests', config.max_guests))
            config.min_age = int(data.get('min_age', config.min_age))

            db.session.commit()

            return jsonify({'success': True, 'config': {
                'nightly_rate': config.nightly_rate,
                'cleaning_fee': config.cleaning_fee,
                'damage_deposit': config.damage_deposit,
                'sales_tax_rate': config.sales_tax_rate,
                'min_nights': config.min_nights,
                'max_nights': config.max_nights,
                'max_guests': config.max_guests,
                'min_age': config.min_age
            }})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500

    config = PricingConfig.query.first()
    return render_template('admin/pricing.html', config=config)

@admin.route('/calendar', methods=['GET', 'POST'])
@login_required
def manage_calendar():
    if request.method == 'POST':
        try:
            data = request.json
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            reason = data.get('reason', '')

            if start_date > end_date:
                return jsonify({'success': False, 'error': 'La fecha inicial debe ser antes de la fecha final'}), 400

            current_date = start_date
            while current_date <= end_date:
                existing = BlockedDate.query.filter_by(date=current_date).first()
                if not existing:
                    blocked = BlockedDate(date=current_date, reason=reason)
                    db.session.add(blocked)

                from datetime import timedelta
                current_date += timedelta(days=1)

            db.session.commit()

            return jsonify({'success': True})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500

    blocked_dates = BlockedDate.query.all()
    return render_template('admin/calendar.html', blocked_dates=blocked_dates)

@admin.route('/blocked-dates/<int:date_id>', methods=['DELETE'])
@login_required
def delete_blocked_date(date_id):
    try:
        blocked = BlockedDate.query.get_or_404(date_id)
        db.session.delete(blocked)
        db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/profile', methods=['GET'])
@login_required
def profile():
    return render_template('admin/profile.html', user=current_user)

@admin.route('/profile/change-password', methods=['POST'])
@login_required
def change_password():
    try:
        data = request.json
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_user.check_password(current_password):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401

        current_user.set_password(new_password)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Password changed successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/pricing', methods=['GET'])
@login_required
def pricing_page():
    pricing = PricingConfig.query.first()
    return render_template('admin/pricing.html', pricing=pricing)

@admin.route('/api/pricing', methods=['GET'])
@login_required
def get_pricing():
    pricing = PricingConfig.query.first()
    if not pricing:
        return jsonify({'error': 'Pricing not configured'}), 404
    return jsonify(pricing.to_dict())

@admin.route('/api/pricing', methods=['POST'])
@login_required
def update_pricing():
    try:
        data = request.json
        pricing = PricingConfig.query.first()

        if not pricing:
            pricing = PricingConfig()

        if 'nightly_rate' in data:
            pricing.nightly_rate = float(data['nightly_rate'])
        if 'rate_2_nights' in data:
            pricing.rate_2_nights = float(data['rate_2_nights'])
        if 'rate_3_nights' in data:
            pricing.rate_3_nights = float(data['rate_3_nights'])
        if 'rate_4plus_nights' in data:
            pricing.rate_4plus_nights = float(data['rate_4plus_nights'])
        if 'cleaning_fee' in data:
            pricing.cleaning_fee = float(data['cleaning_fee'])
        if 'damage_deposit' in data:
            pricing.damage_deposit = float(data['damage_deposit'])
        if 'sales_tax_rate' in data:
            pricing.sales_tax_rate = float(data['sales_tax_rate'])
        if 'min_nights' in data:
            pricing.min_nights = int(data['min_nights'])
        if 'max_nights' in data:
            pricing.max_nights = int(data['max_nights'])
        if 'max_guests' in data:
            pricing.max_guests = int(data['max_guests'])
        if 'min_age' in data:
            pricing.min_age = int(data['min_age'])

        db.session.add(pricing)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Pricing updated successfully', 'pricing': pricing.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/ofertas', methods=['GET'])
@login_required
def manage_offers():
    offers = SeasonalOffer.query.order_by(SeasonalOffer.start_date).all()
    return render_template('admin/ofertas.html', offers=offers)

@admin.route('/api/ofertas', methods=['GET'])
@login_required
def list_offers():
    try:
        offers = SeasonalOffer.query.order_by(SeasonalOffer.start_date).all()
        return jsonify({
            'success': True,
            'offers': [o.to_dict() for o in offers]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/api/ofertas', methods=['POST'])
@login_required
def create_offer():
    try:
        data = request.json

        required = ['name', 'start_date', 'end_date', 'nightly_rate']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Campo requerido: {field}'}), 400

        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()

        if start_date > end_date:
            return jsonify({'success': False, 'error': 'La fecha inicial debe ser antes de la fecha final'}), 400

        offer = SeasonalOffer(
            name=data['name'],
            start_date=start_date,
            end_date=end_date,
            nightly_rate=float(data['nightly_rate']),
            discount_type=data.get('discount_type', 'fixed'),
            active=data.get('active', True)
        )

        db.session.add(offer)
        db.session.commit()

        return jsonify({'success': True, 'offer': offer.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/api/ofertas/<int:offer_id>', methods=['PUT'])
@login_required
def update_offer(offer_id):
    try:
        offer = SeasonalOffer.query.get_or_404(offer_id)
        data = request.json

        if 'name' in data:
            offer.name = data['name']
        if 'start_date' in data:
            offer.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if 'end_date' in data:
            offer.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        if 'nightly_rate' in data:
            offer.nightly_rate = float(data['nightly_rate'])
        if 'discount_type' in data:
            offer.discount_type = data['discount_type']
        if 'active' in data:
            offer.active = data['active']

        if offer.start_date > offer.end_date:
            return jsonify({'success': False, 'error': 'La fecha inicial debe ser antes de la fecha final'}), 400

        db.session.commit()

        return jsonify({'success': True, 'offer': offer.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@admin.route('/api/ofertas/<int:offer_id>', methods=['DELETE'])
@login_required
def delete_offer(offer_id):
    try:
        offer = SeasonalOffer.query.get_or_404(offer_id)
        db.session.delete(offer)
        db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
