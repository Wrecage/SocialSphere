# recaptcha_verification.py

import requests
from django.conf import settings


# #FAAAAAKEEEE
# def verify_recaptcha(token, action):
#     if settings.DEBUG:
#         # Bypass reCAPTCHA in development environment
#         return {
#             'success': True,
#             'score': 1.0,
#             'action': action,
#             'hostname': 'localhost',
#             'challenge_ts': 'bypass',
#         }

#     # Actual reCAPTCHA verification
#     url = 'https://www.google.com/recaptcha/api/siteverify'
#     data = {
#         'secret': settings.RECAPTCHA_SECRET_KEY,
#         'response': token,
#     }
#     try:
#         response = requests.post(url, data=data)
#         result = response.json()
        
#         if result.get("success") and result.get("action") == action:
#             return {
#                 'success': True,
#                 'score': result.get('score', 0.0),
#                 'action': result.get('action'),
#                 'hostname': result.get('hostname'),
#                 'challenge_ts': result.get('challenge_ts'),
#             }
#         return {
#             'success': False,
#             'error-codes': result.get('error-codes', []),
#             'score': result.get('score', 0.0),
#             'action': result.get('action', None),
#             'hostname': result.get('hostname', None),
#             'challenge_ts': result.get('challenge_ts', None),
#         }
#     except requests.exceptions.RequestException:
#         return {
#             'success': False,
#             'error-codes': ['request-failed']
#         }





# REEEYALL
def verify_recaptcha(token, action):
    """
    Verifies the reCAPTCHA token with Google.
    Args:
        token (str): The reCAPTCHA token from the frontend.
        action (str): The action parameter used when generating the token.

    Returns:
        dict: A dictionary with the verification result from Google.
    """
    url = 'https://www.google.com/recaptcha/api/siteverify'
    data = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': token,
    }
    try:
        response = requests.post(url, data=data)
        result = response.json()
        
        # Check if the verification was successful and the action matches
        if result.get("success") and result.get("action") == action:
            return {
                'success': True,
                'score': result.get('score', 0.0),
                'action': result.get('action'),
                'hostname': result.get('hostname'),
                'challenge_ts': result.get('challenge_ts'),
            }
        return {
            'success': False,
            'error-codes': result.get('error-codes', []),
            'score': result.get('score', 0.0),
            'action': result.get('action', None),
            'hostname': result.get('hostname', None),
            'challenge_ts': result.get('challenge_ts', None),
        }
    except requests.exceptions.RequestException:
        return {
            'success': False,
            'error-codes': ['request-failed']
        }
