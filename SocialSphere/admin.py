from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin
from .models import ContentManager,Event,Like,Comment



admin.site.register(ContentManager, UserAdmin)
admin.site.unregister(Group)
admin.site.register(Event)

