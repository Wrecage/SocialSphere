"""
WSGI config for Capstone project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Capstone.settings')

application = get_wsgi_application()


# PYTHON ANYWHERE CONFIGURATION



# import os
# import sys


# path = '/home/SocialSphere/SocialSphere'
# if path not in sys.path:
#     sys.path.append(path)

# os.environ['DJANGO_SETTINGS_MODULE'] = 'Capstone.settings'

# # then:
# from django.core.wsgi import get_wsgi_application
# application = get_wsgi_application()



# What your site is running.

# Source code:
# /home/SocialSphere/SocialSphere

# Go to directory
# Working directory:
# /home/SocialSphere/

# Go to directory
# WSGI configuration file:/var/www/socialsphere_pythonanywhere_com_wsgi.py
# Python version:
# 3.10