import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app, render_template_string

class EmailService:

    @staticmethod
    def send_email(to_email, subject, html_content, text_content=None):
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{current_app.config['SMTP_FROM_NAME']} <{current_app.config['SMTP_FROM_EMAIL']}>"
            msg['To'] = to_email

            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)

            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)

            port = current_app.config['SMTP_PORT']

            # Use SSL_SMTP for port 465, regular SMTP + STARTTLS for 587
            if port == 465:
                with smtplib.SMTP_SSL(current_app.config['SMTP_SERVER'], port) as server:
                    server.login(current_app.config['SMTP_USER'], current_app.config['SMTP_PASSWORD'])
                    server.send_message(msg)
            else:
                with smtplib.SMTP(current_app.config['SMTP_SERVER'], port) as server:
                    server.starttls()
                    server.login(current_app.config['SMTP_USER'], current_app.config['SMTP_PASSWORD'])
                    server.send_message(msg)

            print(f"[SUCCESS] Email enviado a {to_email}")
            return {'success': True}
        except Exception as e:
            print(f"[ERROR] Error enviando email a {to_email}: {str(e)}")
            return {'success': False, 'error': str(e)}

    @staticmethod
    def send_booking_confirmation(booking):
        if not current_app.config.get('SEND_GUEST_CONFIRMATION', True):
            print(f"[INFO] Confirmación al huésped desactivada (dev mode)")
            return {'success': True, 'skipped': True}

        subject = f"Solicitud de Reserva #{booking.confirmation_code} - Villa Lisanna"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px;">
                    <h2 style="color: #2D7A9F;">¡Solicitud Recibida!</h2>
                    <p>Hola {booking.guest_name},</p>
                    <p>Hemos recibido tu solicitud de reserva. Liset revisará tu solicitud y se pondrá en contacto contigo pronto.</p>

                    <h3 style="color: #00E5FF;">Código de Confirmación: {booking.confirmation_code}</h3>

                    <p><strong>Detalles de tu solicitud:</strong></p>
                    <ul>
                        <li>Check-in: {booking.check_in_date.strftime('%d/%m/%Y')}</li>
                        <li>Check-out: {booking.check_out_date.strftime('%d/%m/%Y')}</li>
                        <li>Noches: {booking.nights}</li>
                        <li>Huéspedes: {booking.guest_count}</li>
                        <li>Total: ${booking.total_amount:,.2f}</li>
                        <li>Depósito Requerido: ${booking.deposit_amount:,.2f}</li>
                    </ul>

                    <p>Gracias por elegir Villa Lisanna.</p>
                    <p style="color: #999; font-size: 12px;">Este es un email automático. Por favor no respondas a este correo.</p>
                </div>
            </body>
        </html>
        """

        return EmailService.send_email(booking.guest_email, subject, html_content)

    @staticmethod
    def send_admin_notification(booking):
        subject = f"Nueva Solicitud de Reserva: {booking.confirmation_code}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px; border-left: 4px solid #FFD700;">
                    <h2 style="color: #FFD700;">Nueva Solicitud de Reserva</h2>

                    <p><strong>Cliente:</strong> {booking.guest_name}</p>
                    <p><strong>Email:</strong> {booking.guest_email}</p>
                    <p><strong>Teléfono:</strong> {booking.guest_phone}</p>
                    <p><strong>Código de Confirmación:</strong> {booking.confirmation_code}</p>

                    <h3 style="color: #FFD700;">Detalles de la Reserva</h3>
                    <ul>
                        <li>Check-in: {booking.check_in_date.strftime('%d/%m/%Y')}</li>
                        <li>Check-out: {booking.check_out_date.strftime('%d/%m/%Y')}</li>
                        <li>Noches: {booking.nights}</li>
                        <li>Huéspedes: {booking.guest_count}</li>
                    </ul>

                    <h3 style="color: #FFD700;">Desglose de Precios</h3>
                    <ul>
                        <li>Subtotal: ${booking.subtotal:,.2f}</li>
                        <li>Limpieza: ${booking.cleaning_fee:,.2f}</li>
                        <li>Impuestos: ${booking.taxes:,.2f}</li>
                        <li>Total: ${booking.total_amount:,.2f}</li>
                        <li>Depósito Requerido: ${booking.deposit_amount:,.2f}</li>
                        <li>Saldo: ${booking.balance_amount:,.2f}</li>
                    </ul>

                    <p><strong>Acción Requerida:</strong> Accede al panel de admin para aprobar o rechazar esta solicitud.</p>
                </div>
            </body>
        </html>
        """

        return EmailService.send_email(current_app.config['VILLA_OWNER_EMAIL'], subject, html_content)

    @staticmethod
    def send_deposit_payment_link(booking, payment_url):
        subject = f"Enlace de Pago - Depósito Reserva #{booking.confirmation_code}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px;">
                    <h2 style="color: #2D7A9F;">Tu Reserva fue Aprobada</h2>
                    <p>¡Excelente! Tu solicitud de reserva ha sido aprobada.</p>

                    <h3 style="color: #00E5FF;">Próximo Paso: Paga el Depósito</h3>
                    <p>Depósito requerido: <strong>${booking.deposit_amount:,.2f}</strong></p>

                    <p>
                        <a href="{payment_url}"
                           style="display: inline-block; background-color: #00E5FF; color: #000; padding: 12px 24px;
                                  text-decoration: none; border-radius: 4px; font-weight: bold;">
                            Pagar Depósito Ahora
                        </a>
                    </p>

                    <p style="color: #999; font-size: 12px;">Este enlace expira en 48 horas. Si no pagas en ese tiempo, la reserva será cancelada.</p>
                </div>
            </body>
        </html>
        """

        return EmailService.send_email(booking.guest_email, subject, html_content)
