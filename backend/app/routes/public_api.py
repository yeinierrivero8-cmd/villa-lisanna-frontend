from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, date, timedelta
from app.extensions import db
from app.models import Booking, BlockedDate, Inquiry, PricingConfig, SeasonalOffer
from app.services.pricing import PricingService
from app.services.email_service import EmailService
from app.services.stripe_service import StripeService

api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/offers', methods=['GET'])
def get_active_offers():
    try:
        today = date.today()
        offers = SeasonalOffer.query.filter(
            SeasonalOffer.active == True,
            SeasonalOffer.start_date <= today,
            SeasonalOffer.end_date >= today
        ).all()

        return jsonify({
            'success': True,
            'offers': [o.to_dict() for o in offers]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api.route('/availability', methods=['GET'])
def get_availability():
    try:
        blocked_dates = BlockedDate.query.all()
        blocked_list = [bd.date.isoformat() for bd in blocked_dates]

        booked_dates = set()
        bookings = Booking.query.filter(Booking.status.in_(['approved', 'confirmed', 'completed'])).all()
        for booking in bookings:
            current = booking.check_in_date
            while current < booking.check_out_date:
                booked_dates.add(current.isoformat())
                current += timedelta(days=1)

        unavailable_dates = list(set(blocked_list) | booked_dates)

        return jsonify({
            'success': True,
            'unavailable_dates': sorted(unavailable_dates)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api.route('/quote', methods=['POST'])
def get_quote():
    try:
        data = request.json
        check_in = data.get('check_in') or data.get('check_in_date')
        check_out = data.get('check_out') or data.get('check_out_date')
        guest_count = int(data.get('guest_count', 1))

        if not check_in or not check_out:
            return jsonify({'success': False, 'error': 'Missing check_in_date or check_out_date'}), 400

        quote = PricingService.calculate_quote(check_in, check_out, guest_count)

        if 'error' in quote:
            return jsonify({'success': False, 'error': quote['error']}), 400

        return jsonify({
            'success': True,
            **quote
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api.route('/bookings', methods=['POST'])
def create_booking():
    try:
        data = request.json
        print(f"[DEBUG] Received booking data: {data}")

        required_fields = ['guest_name', 'guest_email', 'guest_phone', 'guest_count']
        for field in required_fields:
            if not data.get(field):
                print(f"[ERROR] Missing required field: {field}")
                return jsonify({'success': False, 'error': f'Campo requerido: {field}'}), 400

        check_in_str = data.get('check_in') or data.get('check_in_date')
        check_out_str = data.get('check_out') or data.get('check_out_date')
        print(f"[DEBUG] check_in_str={check_in_str}, check_out_str={check_out_str}")

        if not check_in_str or not check_out_str:
            print(f"[ERROR] Missing dates: check_in_str={check_in_str}, check_out_str={check_out_str}")
            return jsonify({'success': False, 'error': 'Campo requerido: check_in_date or check_out_date'}), 400

        check_in = datetime.strptime(check_in_str, '%Y-%m-%d').date()
        check_out = datetime.strptime(check_out_str, '%Y-%m-%d').date()
        guest_count = int(data['guest_count'])

        quote = PricingService.calculate_quote(check_in, check_out, guest_count)
        if 'error' in quote:
            return jsonify({'success': False, 'error': quote['error']}), 400

        booking = Booking(
            guest_name=data['guest_name'],
            guest_email=data['guest_email'],
            guest_phone=data['guest_phone'],
            guest_count=guest_count,
            guest_age_confirmed=data.get('age_confirmed', False),
            check_in_date=check_in,
            check_out_date=check_out,
            nights=quote['nights'],
            subtotal=quote['subtotal'],
            cleaning_fee=quote['cleaning_fee'],
            taxes=quote['taxes'],
            damage_deposit=quote['damage_deposit'],
            deposit_amount=quote['deposit_amount'],
            balance_amount=quote['balance_amount'],
            total_amount=quote['total_amount'],
            status='pending'
        )

        booking.generate_confirmation_code()
        db.session.add(booking)
        db.session.commit()

        try:
            EmailService.send_booking_confirmation(booking)
        except Exception as email_err:
            print(f"[ERROR] send_booking_confirmation failed: {str(email_err)}")

        try:
            EmailService.send_admin_notification(booking)
        except Exception as email_err:
            print(f"[ERROR] send_admin_notification failed: {str(email_err)}")

        checkout_url = None
        try:
            return_url = request.host_url.rstrip('/') + '/booking-success'
            stripe_result = StripeService.create_deposit_checkout(booking, return_url)
            if stripe_result['success']:
                checkout_url = stripe_result['url']
                db.session.commit()
                print(f"[SUCCESS] Stripe checkout created: {checkout_url}")
            else:
                print(f"[ERROR] Stripe checkout failed: {stripe_result.get('error')}")
        except Exception as stripe_err:
            print(f"[ERROR] create_deposit_checkout failed: {str(stripe_err)}")

        return jsonify({
            'success': True,
            'booking': {
                'id': booking.id,
                'confirmation_code': booking.confirmation_code,
                'status': booking.status
            },
            'checkout_url': checkout_url
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@api.route('/booking-success', methods=['GET'])
def booking_success():
    from flask import render_template_string

    session_id = request.args.get('session')
    status = request.args.get('status')

    if not session_id or status != 'success':
        return '<h1>Invalid session</h1>', 400

    try:
        stripe_result = StripeService.retrieve_session(session_id)
        if not stripe_result['success']:
            return '<h1>Session not found</h1>', 404

        session = stripe_result['session']
        booking = Booking.query.get(int(session.metadata.get('booking_id')))

        if not booking:
            return '<h1>Booking not found</h1>', 404

        if session.payment_status == 'paid':
            booking.deposit_paid = True
            booking.status = 'confirmed'
            db.session.commit()
            print(f"[SUCCESS] Booking {booking.id} marked as confirmed")

        html = f'''<html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>✅ Reserva Confirmada</h1>
        <p>¡Gracias por tu pago!</p>
        <p>Código: <strong>{booking.confirmation_code}</strong></p>
        <p><a href="/">Volver</a></p>
        </body></html>'''
        return html
    except Exception as e:
        print(f"[ERROR] booking_success: {str(e)}")
        return f'<h1>Error: {str(e)}</h1>', 500

@api.route('/bookings/<code>/status', methods=['GET'])
def get_booking_status(code):
    try:
        booking = Booking.query.filter_by(confirmation_code=code).first()

        if not booking:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404

        return jsonify({
            'success': True,
            'booking': {
                'confirmation_code': booking.confirmation_code,
                'status': booking.status,
                'deposit_paid': booking.deposit_paid,
                'balance_paid': booking.balance_paid,
                'check_in': booking.check_in_date.isoformat(),
                'check_out': booking.check_out_date.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api.route('/inquiries', methods=['POST'])
def create_inquiry():
    try:
        data = request.json

        required_fields = ['name', 'email', 'phone', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Campo requerido: {field}'}), 400

        inquiry = Inquiry(
            name=data['name'],
            email=data['email'],
            phone=data['phone'],
            message=data['message']
        )

        db.session.add(inquiry)
        db.session.commit()

        return jsonify({
            'success': True,
            'inquiry_id': inquiry.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@api.route('/pricing', methods=['GET'])
def get_pricing():
    try:
        pricing = PricingConfig.query.first()
        if not pricing:
            return jsonify({'success': False, 'error': 'Pricing not configured'}), 404
        return jsonify(pricing.to_dict())
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
