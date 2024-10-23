from django import forms
from .models import Event
from .models import ContentManager

from django.contrib.auth.models import Permission

class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ['title','caption']


class ContentManagerForm(forms.ModelForm):
    class Meta:
        model = ContentManager
        fields = ['username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'is_active', 'user_permissions']
    
    user_permissions = forms.ModelMultipleChoiceField(
        queryset=Permission.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        required=False
    )