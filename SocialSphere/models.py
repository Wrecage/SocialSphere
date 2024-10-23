
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models


class ContentManager(AbstractUser):     
    class Meta:
        pass

class Event(models.Model):
    content_manager = models.ForeignKey('ContentManager', on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    caption = models.CharField(max_length=10000)
    photo = models.BinaryField(editable=False)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.caption
    
    def like_count(self):
        return Like.objects.filter(event=self).count()

    def comment_count(self):
        return Comment.objects.filter(event=self).count()

class Like(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()


class Comment(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()
    comment_text = models.TextField()
    comment_date = models.DateTimeField(auto_now_add=True)


class EventStats(models.Model):
    event = models.OneToOneField(Event, on_delete=models.CASCADE, primary_key=True)
    total_likes = models.IntegerField(default=0)
    total_comments = models.IntegerField(default=0)
    total_visitors = models.IntegerField(default=0)
    total_clicks = models.IntegerField(default=0)




  