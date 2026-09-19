from flask import Blueprint, request, jsonify, current_app
import stripe
from app.extensions import db
from app.models import Booking
from app.services.stripe_service import StripeService

webhook = Blueprint('webhook', __name__, url_prefix='/api')

@webhook.route('/stripe/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            current_app.config['STRIPE_WEBHOOK_SECRET']
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400

    try:
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']

            booking_id = session.get('metadata', {}).get('booking_id')
            booking = Booking.query.get(int(booking_id))

            if not booking:
                return jsonify({'error': 'Booking not found'}), 404

            payment_type = session.get('metadata', {}).get('type')

            if payment_type == 'deposit':
                booking.deposit_paid = True
                booking.stripe_deposit_payment_id = session.get('payment_intent')
                booking.status = 'confirmed'
            elif payment_type == 'balance':
                booking.balance_paid = True
                booking.stripe_balance_payment_id = session.get('payment_intent')
                booking.status = 'completed'

            db.session.commit()

            return jsonify({'success': True}), 200

        return jsonify({'success': True}), 200

    except Exception as e:
        print(f"❌ Error procesando webhook: {str(e)}")
        return jsonify({'error': str(e)}), 500
