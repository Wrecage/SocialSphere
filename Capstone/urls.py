"""
URL configuration for Capstone project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from SocialSphere import views
from django.conf import settings
from django.conf.urls.static import static
from SocialSphere import facebook_utils
from SocialSphere import groq_utils
from django.contrib.auth import views as auth_views


# from django.contrib.auth.views import logout_then_login


urlpatterns = [
    path('admin/', admin.site.urls),

    path('', views.event_list, name='event_list'),
    path('events/image/<int:event_id>/', views.view_image, name='view_image'),
    
    path('events/<int:event_id>/', views.event_detail, name='event_detail'),

    path('events/content_login/', views.content_login, name='content_login'),

    #Content Manager Transaction
    path('events/posts/', views.event_posts, name='event_posts'),
    path('events/<int:id>/delete/', views.event_delete, name='delete_event'),
    path('events/analytics/', views.dashboard_analytics, name='dashboard_analytics'),
    path('update_event/<int:event_id>/',views.update_event, name='update_event'),



    path('user_logout/', views.user_logout, name='user_logout'),


    path('remove_photo/<int:event_id>/', views.remove_photo, name='remove_photo'),

    #Visitor Transactions
    path('like_event/<int:event_id>/', views.like_event, name='like_event'),
    path('add_comment/<int:event_id>/', views.add_comment, name='add_comment'),
    path('edit_comment/<int:comment_id>/', views.edit_comment, name='edit_comment'),
    path('delete_comment/<int:comment_id>/', views.delete_comment, name='delete_comment'),

    path('record_click/', views.record_click, name='record_click'),

    #API 
    path('post-to-facebook/<int:event_id>/', facebook_utils.post_to_facebook_view, name='post_to_facebook'),
    path('generate-caption/', groq_utils.handle_caption_generation_request, name='generate_caption'),


    #User Management
    path('add/', views.add_content_manager, name='add_content_manager'),
    path('edit/<int:pk>/', views.edit_content_manager, name='edit_content_manager'),
    path('list/', views.list_content_managers, name='list_content_managers'),



    #password reset
    # password reset with custom view handling
    path('password_reset/', views.custom_password_reset, name='password_reset'),
    path('reset_password/<uidb64>/<token>/', views.reset_password, name='reset_password'),

    # fetch commments real time
    path('fetch_comments/<int:event_id>/', views.fetch_comments, name='fetch_comments'),

    #fetch like counts realtime
    path('get_like_count/<int:event_id>/', views.get_like_count, name='get_like_count'),

    #fetch like status
    path('get_like_status/<int:event_id>/', views.get_like_status, name='get_like_status'),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)