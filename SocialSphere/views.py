
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout as auth_logout
from .models import Event
from .forms import EventForm
from django.conf import settings
from django.http import HttpResponseRedirect
from django.urls import reverse
User = settings.AUTH_USER_MODEL

def is_superuser(user):
    return user.is_superuser

def is_staff(user):
    return user.is_staff


def events_view(request):
    return render(request, 'events.html')



def content_login(request):
    error_message = "" 
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            if is_superuser(user) or is_staff(user):
                # Redirect to admin page if user is superuser or staff
                return HttpResponseRedirect(reverse('admin:index'))
            else:
                # Redirect regular users to event_posts page
                return HttpResponseRedirect(reverse('event_posts'))
        else:
            error_message = "Incorrect username or password"
    return render(request, 'content_manager/content_login.html', {'message': error_message})


def event_list(request):
    events = Event.objects.all()
    return render(request, 'content_manager/event_list.html', {'events': events})

@login_required
def event_posts(request):
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

@login_required      
def event_delete(request,id):
    event = get_object_or_404(Event, pk=id)
    event.delete()
    return redirect('event_posts')

@login_required
def user_logout(request):
    auth_logout(request)
    return redirect('event_list')