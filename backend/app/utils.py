import random
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import uuid
from django.core.mail import EmailMultiAlternatives

def send_congratulations_email(user, attempt, test):
    subject = "🎉 Congratulations on Completing Your Test!"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [user.email]

    text_content = f"Hi {user.username},\nCongratulations! You scored {attempt.score:.2f}% in {test.title}."
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
            <h2 style="color: #1565c0;">Congratulations, {user.username}! 🎉</h2>
            <p>You have successfully completed the <strong>{test.title}</strong> test.</p>
            <p style="font-size: 18px; color: #333;"><strong>Your Score:</strong> {attempt.score:.2f}%</p>
            <p>We are proud of your achievement. Keep up the great work!</p>
            <br/>
            <p style="font-size: 14px; color: #555;">Best wishes,<br><strong>Skill Bridge Team</strong></p>
        </div>
    </body>
    </html>
    """

    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()
def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp):
    """Send OTP to the user's email"""
    subject = "Your OTP Code"
    message = f"Your OTP code is {otp}. It will expire in 10 minutes."
    sender = settings.EMAIL_HOST_USER
    recipient_list = [email]

    send_mail(subject, message, sender, recipient_list)

def encode_testid_to_secure_uuid(testid: int) -> str:
    obfuscated = testid ^ settings.SECURE_TESTID_KEY
    return str(uuid.UUID(int=obfuscated))

def decode_secure_uuid_to_testid(uuid_str: str) -> int:
    obfuscated = uuid.UUID(uuid_str).int
    return obfuscated ^ settings.SECURE_TESTID_KEY