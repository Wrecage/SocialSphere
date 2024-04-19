
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Event
from .forms import EventForm



def events_view(request):
  
    return render(request, 'events.html')



def content_login(request):
    return render(request, 'content_manager/content_login.html')


def event_list(request):
    events = Event.objects.all()
    return render(request, 'content_manager/event_list.html', {'events': events})


def event_posts(request):
    if request.method == 'POST':
        form = EventForm(request.POST, request.FILES)
        if form.is_valid():
            event = form.save(commit=False)
            event.content_manager = request.user  
            event.save()
            return redirect('event_list')
    else:
        form = EventForm()

    events = Event.objects.all()
    return render(request, 'content_manager/event_posts.html', {'form': form, 'events': events})

        
def event_delete(request,id):
    event = get_object_or_404(Event, pk=id)
    event.delete()
    return redirect('event_posts')