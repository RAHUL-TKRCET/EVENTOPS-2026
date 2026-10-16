"""Stable, non-sensitive error codes for public API contracts."""

PUBLIC_REGISTRATION_ERROR_CODES = {
    "EVENT_NOT_FOUND": "This event does not exist or is no longer available.",
    "EVENT_NOT_PUBLISHED": "This event is not open for participant registration yet.",
    "REGISTRATION_DEADLINE_UNAVAILABLE": "Registration is unavailable because the deadline is not configured. Contact the event organizer.",
    "REGISTRATION_CLOSED": "The registration deadline has passed. Contact the event organizer if you think this is incorrect.",
    "PARTICIPANT_ACCOUNT_EXISTS": "An EVENTOPS account already uses these details. Sign in to your existing participant account or contact the organizer for safe account linking.",
    "PARTICIPANT_ALREADY_REGISTERED": "These details already have a participant registration for this event. Sign in or contact the organizer if you need help.",
    "REGISTRATION_CONFLICT": "We could not complete registration because of a data conflict. Please retry once; contact the organizer if it continues.",
    "EMAIL_DELIVERY_UNAVAILABLE": "Registration was not completed because participant email delivery is unavailable. Please retry later or contact the organizer.",
}
