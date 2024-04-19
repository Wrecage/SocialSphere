
from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    content_manager = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)  # Add this line for the title
    caption = models.CharField(max_length=500)
    photo_or_video = models.ImageField(upload_to='events/')
    date = models.DateTimeField()
    reacts = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)

    def __str__(self):
        return self.caption
