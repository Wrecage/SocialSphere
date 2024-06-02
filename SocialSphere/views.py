
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.views.decorators.http import require_POST
from django.urls import reverse
from .facebook_utils import facebook_analytics
from .facebook_utils import  post_to_facebook
from django.utils.http  import url_has_allowed_host_and_scheme
from .models import Event
from .forms import EventForm
from django.http import HttpResponseRedirect
from django.http import JsonResponse
from .models import Event, Like, Comment, EventStats
from django.db.models import Sum
from django.contrib.auth.password_validation import UserAttributeSimilarityValidator, MinimumLengthValidator, CommonPasswordValidator, NumericPasswordValidator
from django.core.exceptions import ValidationError



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

    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip

    def login(self):
        if self.request.user.is_authenticated:
            # Redirect to the previous page or dashboard if already logged in
            next_url = self.request.GET.get('next')
            if next_url and  url_has_allowed_host_and_scheme(next_url, allowed_hosts={self.request.get_host()}):
                return redirect(next_url)
            return redirect('dashboard_analytics')

        error_message = ""
        if self.request.method == 'POST':
            username = self.request.POST.get('username')
            password = self.request.POST.get('password')
            validators = [
                UserAttributeSimilarityValidator(),
                MinimumLengthValidator(min_length=8),
                CommonPasswordValidator(),
                NumericPasswordValidator()
            ]
            try:
                for validator in validators:
                    validator.validate(password)
            except ValidationError as e:
                error_message = ', '.join(e.messages)
                return render(self.request, 'content_manager/content_login.html', {'message': error_message})

            user = authenticate(username=username, password=password)
            if user is not None:
                auth_login(self.request, user)
                next_url = self.request.POST.get('next') or self.request.session.get('last_visited')
                if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={self.request.get_host()}):
                    return redirect(next_url)
                if AuthUtils.is_superuser(user) or AuthUtils.is_staff(user):
                    return HttpResponseRedirect(reverse('dashboard_analytics'))
                else:
                    return HttpResponseRedirect(reverse('event_posts'))
            else:
                error_message = "Incorrect username or password"
        return render(self.request, 'content_manager/content_login.html', {'message': error_message})
    

    def event_list(self):
        events = Event.objects.all().exclude(id=1).order_by('-date')
        return render(self.request, 'content_manager/event_list.html', {'events': events})
    
   
    def event_posts(self, request):
        if request.method == 'POST':
            form = EventForm(request.POST, request.FILES)
            if form.is_valid():
                event = form.save(commit=False)
                event.content_manager = request.user  
                event.save()

                if 'post_to_facebook' in self.request.POST:
                    post_to_facebook(event)

                
                return redirect('event_posts')
        else:
            form = EventForm()

        events = Event.objects.all().exclude(id=1).order_by('-date')
        return render(request, 'content_manager/event_posts.html', {'form': form, 'events': events})
    


    
    def update_event(self, event_id):
        event = Event.objects.get(pk=event_id)
        event.title = self.request.POST.get('title')
        event.caption = self.request.POST.get('caption')

        new_file = self.request.FILES.get('photo')
        if new_file:
            event.photo = new_file
            
        event.save()
        
        return JsonResponse({
            'title': event.title,
            'caption': event.caption,
            'photo': event.photo.url
        })

    def remove_photo(self, event_id):
        event = get_object_or_404(Event, pk=event_id)

        event.photo=None
        event.save()

        return JsonResponse({'success' : True})
    
    def event_delete(self, id):
        event = get_object_or_404(Event, pk=id)
        event.delete()
        return redirect('event_posts')

  
    def user_logout(self):
        auth_logout(self.request)
        return redirect('content_login')


    
    def like_event(self, event_id):
        if self.request.method == 'POST':
            event = get_object_or_404(Event, pk=event_id)
            ip_address = self.get_client_ip()

            if not Like.objects.filter(event=event, ip_address=ip_address).exists():
                Like.objects.create(event=event, ip_address=ip_address)

                event_stats, created = EventStats.objects.get_or_create(event=event)
                event_stats.total_likes += 1
                event_stats.save()

                return JsonResponse({'status': 'success', 'message': 'Like added'})
            return JsonResponse({'status': 'failed', 'message': 'You have already liked this event'})

  
    def add_comment(self, event_id):
        if self.request.method == 'POST':
            event = get_object_or_404(Event, pk=event_id)
            comment_text = self.request.POST.get('comment_text')
            ip_address = self.get_client_ip()

            if comment_text:
                Comment.objects.create(event=event, ip_address=ip_address, comment_text=comment_text)

                event_stats, created = EventStats.objects.get_or_create(event=event)
                event_stats.total_comments += 1
                event_stats.save()

                return JsonResponse({'status': 'success', 'message': 'Comment added'})
            return JsonResponse({'status': 'failed', 'message': 'Invalid request'})
        

    def get_total_likes_and_comments(self):
        total_likes = EventStats.objects.aggregate(Sum('total_likes'))['total_likes__sum'] or 0
        total_comments = EventStats.objects.aggregate(Sum('total_comments'))['total_comments__sum'] or 0

        return {
            'total_likes': total_likes,
            'total_comments': total_comments,
        }

    def dashboard_analytics(self):
        if self.request.user.is_superuser:
            context = facebook_analytics(self.request)

            stats = self.get_total_likes_and_comments()
            context.update(stats)

            dummy_event_stats = EventStats.objects.filter(event__id=1).first()
            total_visitors = dummy_event_stats.total_visitors if dummy_event_stats else 0
            total_clicks = dummy_event_stats.total_clicks if dummy_event_stats else 0

            context['total_visitors'] = total_visitors
            context['total_clicks'] = total_clicks

            return render(self.request, 'content_manager/dashboard_analytics.html', context)
        else:
            return redirect('content_login')

    @staticmethod
    def record_click(request):
        if request.method == 'POST':
            dummy_event = get_object_or_404(Event, id=1)  # Assuming the dummy event has ID 1
            stats, created = EventStats.objects.get_or_create(event=dummy_event)
            stats.total_clicks += 1
            stats.save()
            return JsonResponse({'status': 'success'})
        return JsonResponse({'status': 'failure'}, status=400)    




def content_login(request):
    content_manager = ContentManager(request)
    return content_manager.login()

def event_list(request):
    content_manager = ContentManager(request)
    return content_manager.event_list()

@csrf_exempt
def like_event(request, event_id):
    content_manager = ContentManager(request)
    return content_manager.like_event(event_id)

@csrf_exempt
def add_comment(request, event_id):
    content_manager = ContentManager(request)
    return content_manager.add_comment(event_id)
    

@login_required
def event_posts(request):
    content_manager = ContentManager(request)
    return content_manager.event_posts(request)  

@login_required
@require_POST
def update_event(request, event_id):
    content_manager = ContentManager(request)
    return content_manager.update_event(event_id)

@login_required
@require_POST
def remove_photo(request, event_id):
    content_manager = ContentManager(request)
    return content_manager.remove_photo(event_id)

@login_required
def event_delete(request, id):
    content_manager = ContentManager(request)
    return content_manager.event_delete(id)

@login_required
def user_logout(request):
    content_manager = ContentManager(request)
    return content_manager.user_logout()


@login_required
def dashboard_analytics(request):
    content_manager = ContentManager(request)
    return content_manager.dashboard_analytics()

@method_decorator(csrf_exempt, name='dispatch')
def record_click(request):
    return ContentManager.record_click(request)



