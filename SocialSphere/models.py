
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models

class Event(models.Model):
    content_manager = models.ForeignKey('ContentManager', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    caption = models.CharField(max_length=500)
    photo_or_video = models.ImageField(upload_to='events/')
    date = models.DateTimeField()
    reacts = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)

    def __str__(self):
        return self.caption

class ContentManager(AbstractUser):
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True)
    
    class Meta:
        permissions = [
            ('can_manage_events', 'Can manage events'),
        ]
