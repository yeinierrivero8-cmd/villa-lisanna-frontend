import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app, render_template_string
from html import escape

class EmailService:

    @staticmethod
    def send_email(to_email, subject, html_content, text_content=None):
        try:
            print(f"[DEBUG] send_email() iniciado para: {to_email}")
            print(f"[DEBUG] Asunto: {subject}")

            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{current_app.config['SMTP_FROM_NAME']} <{current_app.config['SMTP_FROM_EMAIL']}>"
            msg['To'] = to_email
            print(f"[DEBUG] Mensaje creado. From: {msg['From']}")

            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)

            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            print(f"[DEBUG] Contenido HTML adjuntado")

            port = current_app.config['SMTP_PORT']
            smtp_server = current_app.config['SMTP_SERVER']
            smtp_user = current_app.config['SMTP_USER']
            print(f"[DEBUG] Configuración SMTP: {smtp_server}:{port}, usuario: {smtp_user}")

            # Use SSL_SMTP for port 465, regular SMTP + STARTTLS for 587
            if port == 465:
                print(f"[DEBUG] Usando SMTP_SSL (puerto {port})")
                with smtplib.SMTP_SSL(smtp_server, port, timeout=30) as server:
                    print(f"[DEBUG] Conexión SSL establecida")
                    server.login(smtp_user, current_app.config['SMTP_PASSWORD'])
                    print(f"[DEBUG] Login exitoso")
                    server.send_message(msg)
                    print(f"[DEBUG] Mensaje enviado")
            else:
                print(f"[DEBUG] Usando SMTP + STARTTLS (puerto {port})")
                with smtplib.SMTP(smtp_server, port, timeout=30) as server:
                    print(f"[DEBUG] Conexión SMTP establecida")
                    server.starttls()
                    print(f"[DEBUG] STARTTLS completado")
                    server.login(smtp_user, current_app.config['SMTP_PASSWORD'])
                    print(f"[DEBUG] Login exitoso")
                    server.send_message(msg)
                    print(f"[DEBUG] Mensaje enviado")

            print(f"[SUCCESS] Email enviado exitosamente a {to_email}")
            return {'success': True}
        except Exception as e:
            import traceback
            print(f"[ERROR] Error enviando email a {to_email}: {str(e)}")
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return {'success': False, 'error': str(e)}

    @staticmethod
    def send_booking_confirmation(booking):
        if not current_app.config.get('SEND_GUEST_CONFIRMATION', True):
            print(f"[INFO] Confirmación al huésped desactivada (dev mode)")
            return {'success': True, 'skipped': True}

        subject = f"Solicitud de Reserva #{booking.confirmation_code} - Villa Lisanna"

        # Escapar datos del usuario para prevenir HTML injection
        guest_name = escape(booking.guest_name)
        confirmation_code = escape(booking.confirmation_code)

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px;">
                    <h2 style="color: #2D7A9F;">¡Solicitud Recibida!</h2>
                    <p>Hola {guest_name},</p>
                    <p>Hemos recibido tu solicitud de reserva. Liset revisará tu solicitud y se pondrá en contacto contigo pronto.</p>

                    <h3 style="color: #00E5FF;">Código de Confirmación: {confirmation_code}</h3>

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
        from app.services.stripe_service import StripeService

        # Escapar datos del usuario
        guest_name = escape(booking.guest_name)
        guest_email = escape(booking.guest_email)
        guest_phone = escape(booking.guest_phone)
        confirmation_code = escape(booking.confirmation_code)

        subject = f"Nueva Solicitud de Reserva: {confirmation_code}"

        payment_qr_url = f"{current_app.config.get('BASE_URL', 'https://www.villalisanna.com')}/api/bookings/{confirmation_code}/balance-checkout"
        qr_result = StripeService.generate_payment_qr(confirmation_code, payment_qr_url)

        qr_image = ""
        if qr_result['success']:
            qr_image = f"""
            <h3 style="color: #FFD700;">Código QR para Pago de Saldo</h3>
            <p style="font-size: 12px; color: #666;">Muéstrale este QR al cliente el día del check-in. Él escanea y paga el saldo restante.</p>
            <div style="text-align: center; margin: 20px 0;">
                <img src="{qr_result['qr_data_uri']}" alt="QR Pago Saldo" style="width: 250px; height: 250px; border: 2px solid #FFD700; padding: 10px; background: #fff;">
            </div>
            <p style="font-size: 12px; color: #666;"><strong>Link directo (si el QR no funciona):</strong><br>{payment_qr_url}</p>
            """

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px; border-left: 4px solid #FFD700;">
                    <h2 style="color: #FFD700;">Nueva Solicitud de Reserva</h2>

                    <p><strong>Cliente:</strong> {guest_name}</p>
                    <p><strong>Email:</strong> {guest_email}</p>
                    <p><strong>Teléfono:</strong> {guest_phone}</p>
                    <p><strong>Código de Confirmación:</strong> {confirmation_code}</p>

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
                        <li><strong>Total a Cobrar: ${booking.total_amount:,.2f}</strong></li>
                    </ul>

                    {qr_image}

                    <p style="color: #999; font-size: 12px;">Este es un email automático. Por favor no respondas a este correo.</p>
                </div>
            </body>
        </html>
        """

        return EmailService.send_email(current_app.config['VILLA_OWNER_EMAIL'], subject, html_content)

    @staticmethod
    def send_booking_balance_receipt(booking):
        # Escapar datos del usuario
        guest_name = escape(booking.guest_name)
        confirmation_code = escape(booking.confirmation_code)

        subject = f"Saldo Pagado - Reserva {confirmation_code}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px;">
                    <h2 style="color: #2D7A9F;">✅ ¡Pago Completo Recibido!</h2>
                    <p>Hola {guest_name},</p>
                    <p>Hemos recibido el pago del saldo de tu reserva. Tu reserva está confirmada.</p>

                    <h3 style="color: #00E5FF;">Código de Reserva: {confirmation_code}</h3>

                    <p><strong>Detalles de tu reserva:</strong></p>
                    <ul>
                        <li>Check-in: {booking.check_in_date.strftime('%d/%m/%Y')}</li>
                        <li>Check-out: {booking.check_out_date.strftime('%d/%m/%Y')}</li>
                        <li>Noches: {booking.nights}</li>
                        <li>Huéspedes: {booking.guest_count}</li>
                        <li>Depósito Pagado: ${booking.deposit_amount:,.2f}</li>
                        <li>Saldo Pagado: ${booking.balance_amount:,.2f}</li>
                        <li>Total: ${booking.total_amount:,.2f}</li>
                    </ul>

                    <p><strong>¡Tu apartamento está listo para recibirte!</strong></p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p>Gracias por elegir Villa Lisanna.</p>

                    <p style="color: #999; font-size: 12px;">Este es un email automático. Por favor no respondas a este correo.</p>
                </div>
            </body>
        </html>
        """

        return EmailService.send_email(booking.guest_email, subject, html_content)
