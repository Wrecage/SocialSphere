from django.urls import path
from . import views
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('events/', views.event_list, name='event_list'),
    path('events/content_login/', views.content_login, name='content_login'),
    path('events/posts/', views.event_posts, name='event_posts'),
    
]

# this means nboting