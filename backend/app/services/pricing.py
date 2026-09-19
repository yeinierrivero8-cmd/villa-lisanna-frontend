from datetime import datetime, date, timedelta
from app.extensions import db
from app.models import PricingConfig, SeasonalOffer

class PricingService:

    @staticmethod
    def get_config():
        config = PricingConfig.query.first()
        if not config:
            config = PricingConfig()
            db.session.add(config)
            db.session.commit()
        return config

    @staticmethod
    def calculate_nights(check_in, check_out):
        if isinstance(check_in, str):
            check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
        if isinstance(check_out, str):
            check_out = datetime.strptime(check_out, '%Y-%m-%d').date()
        return (check_out - check_in).days

    @staticmethod
    def get_active_offer(check_in, check_out):
        if isinstance(check_in, str):
            check_in = datetime.strptime(check_in, '%Y-%m-%d').date()
        if isinstance(check_out, str):
            check_out = datetime.strptime(check_out, '%Y-%m-%d').date()

        offer = SeasonalOffer.query.filter(
            SeasonalOffer.active == True,
            SeasonalOffer.start_date <= check_in,
            SeasonalOffer.end_date >= (check_out - timedelta(days=1))
        ).first()

        return offer

    @staticmethod
    def calculate_quote(check_in, check_out, guest_count):
        config = PricingService.get_config()

        nights = PricingService.calculate_nights(check_in, check_out)

        if nights < config.min_nights:
            return {'error': f'Mínimo {config.min_nights} noches requeridas'}

        if nights > config.max_nights:
            return {'error': f'Máximo {config.max_nights} noches permitidas'}

        if guest_count > config.max_guests:
            return {'error': f'Máximo {config.max_guests} huéspedes permitidos'}

        offer = PricingService.get_active_offer(check_in, check_out)
        if offer:
            nightly_rate = offer.nightly_rate
            offer_name = offer.name
        else:
            if nights == 2:
                nightly_rate = config.rate_2_nights
            elif nights == 3:
                nightly_rate = config.rate_3_nights
            elif nights >= 4:
                nightly_rate = config.rate_4plus_nights
            else:
                nightly_rate = config.nightly_rate
            offer_name = None

        subtotal = (nightly_rate * nights) + config.cleaning_fee
        taxes = subtotal * config.sales_tax_rate
        total_taxable = subtotal + taxes

        deposit_amount = round(total_taxable * 0.5, 2)
        balance_amount = round(total_taxable - deposit_amount, 2)

        return {
            'nights': nights,
            'nightly_rate': nightly_rate,
            'subtotal': round(subtotal, 2),
            'cleaning_fee': config.cleaning_fee,
            'taxes': round(taxes, 2),
            'subtotal_with_tax': round(total_taxable, 2),
            'damage_deposit': config.damage_deposit,
            'deposit_amount': deposit_amount,
            'balance_amount': balance_amount,
            'total_amount': round(total_taxable, 2),
            'offer_applied': offer_name
        }

    @staticmethod
    def update_config(data):
        config = PricingService.get_config()

        config.nightly_rate = data.get('nightly_rate', config.nightly_rate)
        config.cleaning_fee = data.get('cleaning_fee', config.cleaning_fee)
        config.damage_deposit = data.get('damage_deposit', config.damage_deposit)
        config.sales_tax_rate = data.get('sales_tax_rate', config.sales_tax_rate)
        config.min_nights = data.get('min_nights', config.min_nights)
        config.max_nights = data.get('max_nights', config.max_nights)
        config.max_guests = data.get('max_guests', config.max_guests)
        config.min_age = data.get('min_age', config.min_age)

        db.session.commit()
        return config
