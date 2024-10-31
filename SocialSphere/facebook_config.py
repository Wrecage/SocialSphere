import os

# Retrieve Facebook Graph API credentials from environment variables
app_id = os.getenv('FACEBOOK_APP_ID')
app_secret = os.getenv('FACEBOOK_APP_SECRET')
ACCESS_TOKEN = os.getenv('FACEBOOK_ACCESS_TOKEN')
PAGE_ID = os.getenv('FACEBOOK_PAGE_ID')
