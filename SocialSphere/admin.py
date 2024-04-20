from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin
from .models import ContentManager

# Register your models here.
admin.site.register(ContentManager, UserAdmin)
admin.site.unregister(Group)