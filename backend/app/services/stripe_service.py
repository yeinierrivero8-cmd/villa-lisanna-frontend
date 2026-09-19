import stripe
from flask import current_app, url_for
from app.models import Booking

class StripeService:

    @staticmethod
    def init_stripe():
        stripe.api_key = current_app.config['STRIPE_SECRET_KEY']

    @staticmethod
    def create_deposit_checkout(booking, return_url_base):
        StripeService.init_stripe()

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Villa Lisanna - Depósito Reserva {booking.confirmation_code}',
                            'description': f'Depósito (50%) del {booking.check_in_date} al {booking.check_out_date}',
                        },
                        'unit_amount': int(booking.deposit_amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{return_url_base}?status=success&session={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{return_url_base}?status=cancel",
                metadata={
                    'booking_id': booking.id,
                    'type': 'deposit'
                }
            )

            booking.stripe_deposit_session_id = session.id
            return {'success': True, 'session_id': session.id, 'url': session.url}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def create_balance_checkout(booking, return_url_base):
        StripeService.init_stripe()

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Villa Lisanna - Saldo Reserva {booking.confirmation_code}',
                            'description': f'Saldo del {booking.check_in_date} al {booking.check_out_date}',
                        },
                        'unit_amount': int(booking.balance_amount * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{return_url_base}?status=success&session={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{return_url_base}?status=cancel",
                metadata={
                    'booking_id': booking.id,
                    'type': 'balance'
                }
            )

            booking.stripe_balance_session_id = session.id
            return {'success': True, 'session_id': session.id, 'url': session.url}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def retrieve_session(session_id):
        StripeService.init_stripe()

        try:
            session = stripe.checkout.Session.retrieve(session_id)
            return {'success': True, 'session': session}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def handle_payment_intent_succeeded(payload):
        StripeService.init_stripe()

        try:
            session_id = payload.get('data', {}).get('object', {}).get('checkout_session', {}).get('id')
            if not session_id:
                return {'success': False, 'error': 'Session ID not found'}

            session = stripe.checkout.Session.retrieve(session_id)

            booking = Booking.query.get(int(session.metadata.get('booking_id')))
            if not booking:
                return {'success': False, 'error': 'Booking not found'}

            payment_type = session.metadata.get('type')
            if payment_type == 'deposit':
                booking.deposit_paid = True
                booking.stripe_deposit_payment_id = session.payment_intent
                booking.status = 'confirmed'
            elif payment_type == 'balance':
                booking.balance_paid = True
                booking.stripe_balance_payment_id = session.payment_intent
                booking.status = 'completed'

            return {'success': True, 'booking': booking}
        except Exception as e:
            return {'success': False, 'error': str(e)}
