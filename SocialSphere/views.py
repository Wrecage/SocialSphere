from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout as auth_logout
from .models import Event
from .forms import EventForm
from django.conf import settings
from django.http import HttpResponseRedirect
from django.urls import reverse

User = settings.AUTH_USER_MODEL

class AuthUtils:
    @staticmethod
    def is_superuser(user):
        return user.is_superuser

    @staticmethod
    def is_staff(user):
        return user.is_staff

class ContentManager:
    def __init__(self, request):
        self.request = request

    def login(self):
        error_message = ""
        if self.request.method == 'POST':
            username = self.request.POST.get('username')
            password = self.request.POST.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(self.request, user)
                if AuthUtils.is_superuser(user) or AuthUtils.is_staff(user):
                    # Redirect to admin page if user is superuser or staff
                    return HttpResponseRedirect(reverse('admin:index'))
                else:
                    # Redirect regular users to event_posts page
                    return HttpResponseRedirect(reverse('event_posts'))
            else:
                error_message = "Incorrect username or password"
        return render(self.request, 'content_manager/content_login.html', {'message': error_message})

    def event_list(self):
        events = Event.objects.all()
        return render(self.request, 'content_manager/event_list.html', {'events': events})
    
  
    def event_posts(self, request):
        if request.method == 'POST':
            form = EventForm(request.POST, request.FILES)
            if form.is_valid():
                event = form.save(commit=False)
                event.content_manager = request.user  
                event.save()
                return redirect('event_posts')
        else:
            form = EventForm()

        events = Event.objects.all()
        return render(request, 'content_manager/event_posts.html', {'form': form, 'events': events})


    
    def event_delete(self, id):
        event = get_object_or_404(Event, pk=id)
        event.delete()
        return redirect('event_posts')

  
    def user_logout(self):
        auth_logout(self.request)
        return redirect('event_list')

class EventsView:
    def __init__(self, request):
        self.request = request

    def events_view(self):
        return render(self.request, 'events.html')




def content_login(request):
    content_manager = ContentManager(request)
    return content_manager.login()

def event_list(request):
    content_manager = ContentManager(request)
    return content_manager.event_list()

@login_required
def event_posts(request):
    content_manager = ContentManager(request)
    return content_manager.event_posts(request)  

@login_required
def event_delete(request, id):
    content_manager = ContentManager(request)
    return content_manager.event_delete(id)

@login_required
def user_logout(request):
    content_manager = ContentManager(request)
    return content_manager.user_logout()

def events_view(request):
    events_view = EventsView(request)
    return events_view.events_view()
