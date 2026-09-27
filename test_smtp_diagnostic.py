#!/usr/bin/env python3
"""
SMTP Diagnostic Tool for Villa Lisanna
Prueba diferentes configuraciones de SMTP para encontrar la que funciona
"""

import smtplib
import ssl
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Colores para terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

class SMTPDiagnostic:
    def __init__(self, smtp_configs):
        self.configs = smtp_configs
        self.results = []

    def log(self, level, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        if level == "SUCCESS":
            print(f"{GREEN}[{timestamp}] ✓ {message}{RESET}")
        elif level == "ERROR":
            print(f"{RED}[{timestamp}] ✗ {message}{RESET}")
        elif level == "WARNING":
            print(f"{YELLOW}[{timestamp}] ⚠ {message}{RESET}")
        elif level == "INFO":
            print(f"{BLUE}[{timestamp}] ℹ {message}{RESET}")

    def test_smtp_config(self, config_name, smtp_server, smtp_port, username, password, use_ssl=False):
        """Test una configuración SMTP específica"""

        print(f"\n{'='*60}")
        print(f"Testing: {config_name}")
        print(f"Server: {smtp_server}:{smtp_port}")
        print(f"User: {username}")
        print(f"{'='*60}")

        try:
            # Step 1: Connection
            self.log("INFO", f"Attempting connection to {smtp_server}:{smtp_port}")

            if use_ssl:
                self.log("INFO", "Using SMTP_SSL (port 465)")
                server = smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=10)
            else:
                self.log("INFO", "Using SMTP + STARTTLS (port 587)")
                server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)

            self.log("SUCCESS", "Connection established")

            # Step 2: STARTTLS (if not using SSL)
            if not use_ssl:
                self.log("INFO", "Starting STARTTLS")
                server.starttls()
                self.log("SUCCESS", "STARTTLS completed")

            # Step 3: Login
            self.log("INFO", f"Attempting login as {username}")
            server.login(username, password)
            self.log("SUCCESS", "Login successful")

            # Step 4: Send test email
            self.log("INFO", "Preparing test email")

            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"[DIAGNOSTIC] SMTP Test - {config_name}"
            msg['From'] = f"Villa Lisanna <{username}>"
            msg['To'] = username

            text = f"SMTP Configuration Test\nServer: {smtp_server}\nPort: {smtp_port}"
            html = f"""
            <html>
                <body>
                    <h2>SMTP Configuration Test - SUCCESS</h2>
                    <p><strong>Config Name:</strong> {config_name}</p>
                    <p><strong>Server:</strong> {smtp_server}:{smtp_port}</p>
                    <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p style="color: green;"><strong>Status: WORKING ✓</strong></p>
                </body>
            </html>
            """

            msg.attach(MIMEText(text, 'plain'))
            msg.attach(MIMEText(html, 'html'))

            self.log("INFO", "Sending test email")
            server.send_message(msg)
            self.log("SUCCESS", "Test email sent successfully")

            server.quit()

            # Record success
            self.results.append({
                'config': config_name,
                'server': smtp_server,
                'port': smtp_port,
                'status': 'SUCCESS'
            })

            return True

        except smtplib.SMTPAuthenticationError as e:
            self.log("ERROR", f"Authentication failed: {str(e)}")
            self.log("WARNING", "Check username/password are correct")
            self.results.append({
                'config': config_name,
                'server': smtp_server,
                'port': smtp_port,
                'status': 'AUTH_FAILED',
                'error': str(e)
            })
            return False

        except smtplib.SMTPException as e:
            self.log("ERROR", f"SMTP Error: {str(e)}")
            self.results.append({
                'config': config_name,
                'server': smtp_server,
                'port': smtp_port,
                'status': 'SMTP_ERROR',
                'error': str(e)
            })
            return False

        except TimeoutError as e:
            self.log("ERROR", f"Timeout: Connection timed out (firewall?)")
            self.results.append({
                'config': config_name,
                'server': smtp_server,
                'port': smtp_port,
                'status': 'TIMEOUT',
                'error': str(e)
            })
            return False

        except Exception as e:
            self.log("ERROR", f"Unexpected error: {type(e).__name__}: {str(e)}")
            self.results.append({
                'config': config_name,
                'server': smtp_server,
                'port': smtp_port,
                'status': 'FAILED',
                'error': str(e)
            })
            return False

    def print_summary(self):
        """Print summary of all tests"""
        print(f"\n\n{'='*60}")
        print("DIAGNOSTIC SUMMARY")
        print(f"{'='*60}\n")

        for result in self.results:
            status_icon = "✓" if result['status'] == 'SUCCESS' else "✗"
            status_color = GREEN if result['status'] == 'SUCCESS' else RED

            print(f"{status_color}{status_icon}{RESET} {result['config']}: {result['status']}")
            if 'error' in result:
                print(f"   Error: {result['error']}\n")

        successful = [r for r in self.results if r['status'] == 'SUCCESS']
        if successful:
            print(f"\n{GREEN}WORKING CONFIGURATIONS:{RESET}")
            for r in successful:
                print(f"  - {r['config']} ({r['server']}:{r['port']})")
            print(f"\n{GREEN}Update your .env to use one of these configs{RESET}\n")


def main():
    """Main diagnostic routine"""

    print(f"{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Villa Lisanna SMTP Diagnostic Tool{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

    # Get credentials from input
    print("Enter SMTP credentials to test:\n")

    username = input("SMTP Username (e.g. admin@villalisanna.com): ").strip()
    password = input("SMTP Password: ").strip()

    if not username or not password:
        print(f"{RED}Error: Username and password are required{RESET}")
        sys.exit(1)

    # Define SMTP configurations to test
    configs = [
        # Current config (failing)
        {
            'name': 'Namecheap Private Email - SSL (Port 465)',
            'server': 'mail.privateemail.com',
            'port': 465,
            'use_ssl': True
        },

        # Alternative: Namecheap with STARTTLS
        {
            'name': 'Namecheap Private Email - STARTTLS (Port 587)',
            'server': 'mail.privateemail.com',
            'port': 587,
            'use_ssl': False
        },

        # Alternative: Namecheap on port 25
        {
            'name': 'Namecheap Private Email - Plain SMTP (Port 25)',
            'server': 'mail.privateemail.com',
            'port': 25,
            'use_ssl': False
        },

        # Fallback: SendGrid
        {
            'name': 'SendGrid SMTP',
            'server': 'smtp.sendgrid.net',
            'port': 587,
            'use_ssl': False,
            'note': '(Use: username="apikey", password="SG.xxxxx")'
        },

        # Fallback: Gmail
        {
            'name': 'Gmail SMTP',
            'server': 'smtp.gmail.com',
            'port': 587,
            'use_ssl': False,
            'note': '(Use Gmail account + App Password)'
        },
    ]

    diagnostic = SMTPDiagnostic(configs)

    # Test each config
    for config in configs:
        if 'note' in config:
            print(f"\n{YELLOW}Note: {config['note']}{RESET}\n")
            continue

        diagnostic.test_smtp_config(
            config['name'],
            config['server'],
            config['port'],
            username,
            password,
            use_ssl=config['use_ssl']
        )

        # Stop if we found a working config
        if diagnostic.results[-1]['status'] == 'SUCCESS':
            print(f"\n{GREEN}✓ Found working configuration!{RESET}")
            break

    # Print summary
    diagnostic.print_summary()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Diagnostic interrupted by user{RESET}")
        sys.exit(0)
