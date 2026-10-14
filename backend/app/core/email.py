"""Email delivery helpers for account registration workflows.

The application deliberately has no silent console/mock fallback: when SMTP is
not configured, delivery fails and the caller must not claim that email was sent.
"""
from email.message import EmailMessage
import smtplib
import ssl

from app.core.config import settings


class EmailDeliveryError(RuntimeError):
    """Email could not be handed off to the configured mail provider."""


def send_participant_credentials(to_email: str, name: str, email: str, password: str, event_name: str, event_id: str) -> None:
    if settings.EMAIL_PROVIDER.strip().lower() != "smtp":
        raise EmailDeliveryError("Participant email delivery is not configured. Set EMAIL_PROVIDER=smtp and the SMTP settings.")

    required = (settings.SMTP_HOST, settings.SMTP_FROM_EMAIL, settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
    if not all(value and str(value).strip() for value in required):
        raise EmailDeliveryError("Participant email delivery is unavailable because SMTP credentials or sender configuration are missing.")

    app_url = settings.PUBLIC_APP_URL.rstrip("/")
    login_url = f"{app_url}/participant/login?eventId={event_id}"
    message = EmailMessage()
    message["Subject"] = f"Your EVENTOPS login for {event_name}"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(
        f"Hello {name},\n\n"
        f"Your registration for {event_name} has been completed. Your EVENTOPS participant space is ready.\n\n"
        f"Event: {event_name}\nEvent ID: {event_id}\n"
        f"Login page: {login_url}\n\n"
        f"Email: {email}\nTemporary password: {password}\n\n"
        "Keep these login details private. Sign in and change your password as soon as the account settings feature allows. "
        "If you did not request this registration, contact the event organizer.\n"
    )

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            if settings.SMTP_USE_TLS:
                server.starttls(context=context)
                server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            refused = server.send_message(message)
            if refused:
                raise EmailDeliveryError("The email provider refused delivery to the participant address.")
    except Exception as exc:
        raise EmailDeliveryError("The email provider did not accept the participant credentials message.") from exc
