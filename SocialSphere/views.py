from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.views.decorators.http import require_POST
from django.urls import reverse
from .facebook_utils import facebook_analytics, post_to_facebook
from django.utils.http import url_has_allowed_host_and_scheme
from django.core.cache import cache
from datetime import datetime, timedelta
from .models import Event, Like, Comment, EventStats
from .models import ContentManager
from .forms import EventForm, ContentManagerForm
from django.http import HttpResponseRedirect, JsonResponse
from django.db.models import Sum
from django.contrib.auth.password_validation import (
    UserAttributeSimilarityValidator,
    MinimumLengthValidator,
    CommonPasswordValidator,
    NumericPasswordValidator
)
from django.core.exceptions import ValidationError
from .facebook_config import PAGE_ID, ACCESS_TOKEN
from .groq_utils import handle_caption_generation_request
from .profanity_filter import check_profanity, contains_links
from .recaptcha_validator import  verify_recaptcha
from .website_utils import get_website_analytics_data , get_website_pie_data
import platform
from django.utils.timezone import localtime
from django.utils import timezone
import logging
import uuid
import requests

logger = logging.getLogger(__name__)
User = settings.AUTH_USER_MODEL

class AuthUtils:
    @staticmethod
    def is_superuser(user):
        return user.is_superuser

    @staticmethod
    def is_staff(user):
        return user.is_staff

class ContentManagerUtility:
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
            next_url = self.request.GET.get('next')
            if next_url and url_has_allowed_host_and_scheme(next_url, allowed_hosts={self.request.get_host()}):
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

                if user.is_superuser:
                    return HttpResponseRedirect(reverse('dashboard_analytics'))
                elif user.is_staff:
                    return HttpResponseRedirect(reverse('event_posts'))
                else:
                    return HttpResponseRedirect(reverse('event_posts'))
            else:
                error_message = "Incorrect username or password"
        return render(self.request, 'content_manager/content_login.html', {'message': error_message})

    def event_list(self):
        events = Event.objects.all()\
        .exclude(title__startswith='Dummy Event')\
        .exclude(title__startswith='Daily Event')\
        .order_by('-date')
        
        ip_address = self.get_client_ip()
        liked_events = Like.objects.filter(ip_address=ip_address).values_list('event_id', flat=True)
        context = {
            'events': events,
            'liked_events': liked_events,
        }
        return render(self.request, 'content_manager/event_list.html', context)

    
    def event_detail(self, event_id):
        event = get_object_or_404(Event, id=event_id)
        comments = Comment.objects.filter(event=event).order_by('-comment_date')
        client_ip = self.get_client_ip()
        
        # Create a list of comments with their corresponding avatar styles using a consistent session key
        comments_with_styles = []
        for comment in comments:
            # Use the comment ID as the session key to store/retrieve avatar style
            comment_style_key = f"avatar_style_{comment.id}"
            avatar_style = self.request.session.get(comment_style_key, 'pixel-art')  # Default to 'pixel-art' if not found
            comments_with_styles.append({'comment': comment, 'avatar_style': avatar_style})

        context = {
            'event': event,
            'comments_with_styles': comments_with_styles,  # Pass the comments with avatar styles
            'client_ip': client_ip,
            'is_superuser': self.request.user.is_superuser,
            'is_staff': self.request.user.is_staff,
        }
        return render(self.request, 'content_manager/event_detail.html', context)

    def event_posts(self):
        if self.request.method == 'POST':
            form = EventForm(self.request.POST, self.request.FILES)
            if form.is_valid():
                event = form.save(commit=False)
                event.content_manager = self.request.user
                event.save()

                if 'generate_caption' in self.request.POST:
                    return handle_caption_generation_request(self.request)

                if 'post_to_facebook' in self.request.POST:
                    post_to_facebook(event)

                return redirect('event_posts')
        else:
            form = EventForm()

        events = Event.objects.all()\
        .exclude(title__startswith='Dummy Event')\
        .exclude(title__startswith='Daily Event')\
        .order_by('-date')
        
        return render(self.request, 'content_manager/event_posts.html', {'form': form, 'events': events})

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
        event.photo = None
        event.save()

        return JsonResponse({'success': True})

    def event_delete(self, id):
        event = get_object_or_404(Event, pk=id)
        event.delete()
        return redirect('event_posts')

    def user_logout(self):
        auth_logout(self.request)
        return redirect('content_login')

    def like_event(self, event_id):
        event = get_object_or_404(Event, pk=event_id)
        ip_address = self.get_client_ip()
        logger.debug(f"IP Address: {ip_address}, Event ID: {event_id}")

        like, created = Like.objects.get_or_create(event=event, ip_address=ip_address)

        if not created:
            logger.debug(f"Like already exists, deleting: {like}")
            like.delete()
            liked = False
        else:
            logger.debug(f"Creating a new like: {like}")
            liked = True

        event_stats, _ = EventStats.objects.get_or_create(event=event)
        event_stats.total_likes = Like.objects.filter(event=event).count()
        event_stats.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Your like status has been updated.',
            'liked': liked,
            'total_likes': event_stats.total_likes
        })
    
    
    
    def add_comment(self, event_id):
        if self.request.method == 'POST':
            event = get_object_or_404(Event, pk=event_id)
            comment_text = self.request.POST.get('comment_text')
            ip_address = self.get_client_ip()
            honeypot = self.request.POST.get('honeypot')
            avatar_style = self.request.POST.get('avatar_style', 'pixel-art')  # Get the avatar style from the form
            recaptcha_token = self.request.POST.get('recaptcha_token')

            recaptcha_response = requests.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={
                    'secret': settings.RECAPTCHA_SECRET_KEY,
                    'response': recaptcha_token,
                    'remoteip': ip_address,
                }
            )
            recaptcha_result = recaptcha_response.json()
            if not recaptcha_result.get('success'):
                return JsonResponse({'status': 'failed', 'message': 'reCAPTCHA verification failed. Please try again.'})
            
            if check_profanity(comment_text):
                return JsonResponse({'status': 'failed', 'message': 'Your comment contains prohibited language.'})

            if contains_links(comment_text):
                return JsonResponse({'status': 'failed', 'message': 'Comments with links are not allowed.'})

            if honeypot:
                return JsonResponse({'status': 'failed', 'message': 'Spam detected. Please refrain from spamming the comment section.'})

            # Rate limiting logic
            rate_limit_key = f"comment_rate_limit_{self.request.user.id or ip_address}_{event_id}"
            rate_data = cache.get(rate_limit_key)
            if not rate_data:
                rate_data = {'count': 0, 'start_time': datetime.now().timestamp()}
            time_diff = datetime.now().timestamp() - rate_data['start_time']
            if time_diff > 60:
                rate_data = {'count': 0, 'start_time': datetime.now().timestamp()}
            if rate_data['count'] >= 5:
                remaining_time = 60 - int(time_diff)
                return JsonResponse({'status': 'failed', 'message': 'You have reached the comment limit of 5 per minute.', 'remaining_time': remaining_time})
            rate_data['count'] += 1
            cache.set(rate_limit_key, rate_data, timeout=60)  

            # Create comment first to get the comment ID
            comment = Comment.objects.create(event=event, ip_address=ip_address, comment_text=comment_text)
            comment_date = comment.comment_date.strftime('%Y-%m-%d %H:%M:%S')
                

            # Format the comment date to the desired string format with the correct time zone
            formatted_comment_date = localtime(comment.comment_date).strftime('%b. %d, %Y, %I:%M %p')

            # Replace leading zero in the day component manually
            formatted_comment_date = formatted_comment_date.replace(" 0", " ")

            # Replace AM/PM with a.m./p.m.
            formatted_comment_date = formatted_comment_date.replace("AM", "a.m.").replace("PM", "p.m.")

            # Capitalize the first letter in the formatted string
            formatted_comment_date = formatted_comment_date[0].upper() + formatted_comment_date[1:]


            # Use the actual comment ID for the session key
            comment_id = comment.id  # Use comment's ID instead of generating a UUID
            unique_comment_style_key = f"avatar_style_{comment_id}"
            self.request.session[unique_comment_style_key] = avatar_style

            event_stats, _ = EventStats.objects.get_or_create(event=event)
            event_stats.total_comments = Comment.objects.filter(event=event).count()
            event_stats.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Comment added',
                'comment_text': comment.comment_text,
                'comment_id': comment.id,
                'comment_date': comment_date,
                'comment_date': formatted_comment_date, 
                'avatar_style': avatar_style,
                'ip_address': ip_address,
                'unique_id': comment_id,
                'total_comments': event_stats.total_comments   
            })

        return JsonResponse({'status': 'failed', 'message': 'Invalid request'}, status=400)

    def edit_comment(self, comment_id):
        if self.request.method == 'POST':
            comment = get_object_or_404(Comment, pk=comment_id)
            ip_address = self.request.META.get('REMOTE_ADDR')

            if comment.ip_address == ip_address:
                comment_text = self.request.POST.get('comment_text')

                if comment_text:
                    comment.comment_text = comment_text
                    comment.save()
                    return JsonResponse({'status': 'success', 'message': 'Comment edited'})
                return JsonResponse({'status': 'failed', 'message': 'Invalid request'})
            else:
                return JsonResponse({'status': 'failed', 'message': 'Unauthorized'})
        return JsonResponse({'status': 'failed', 'message': 'Invalid request method'})

    def delete_comment(self, comment_id):
        if self.request.method == 'POST':
            comment = get_object_or_404(Comment, pk=comment_id)
            ip_address = self.get_client_ip()

            if comment.ip_address == ip_address or self.request.user.is_superuser or self.request.user.is_staff:
                event = comment.event
                comment.delete()

                event_stats = get_object_or_404(EventStats, event=event)
                event_stats.total_comments -= 1
                event_stats.save()

                return JsonResponse({'status': 'success', 'message': 'Comment deleted'})
            else:
                return JsonResponse({'status': 'failed', 'message': 'Unauthorized'})
        return JsonResponse({'status': 'failed', 'message': 'Invalid request method'})


    def get_total_likes_and_comments(self):
        total_likes = EventStats.objects.aggregate(Sum('total_likes'))['total_likes__sum'] or 0
        total_comments = EventStats.objects.aggregate(Sum('total_comments'))['total_comments__sum'] or 0

        return {
            'total_likes': total_likes,
            'total_comments': total_comments,
        }

    @staticmethod
    def record_click(request):
        if request.method == 'POST':
            # Track clicks for the current month using the dummy event
            content_manager = ContentManager.objects.first()  # Assuming at least one content manager
            if content_manager:
                current_month = timezone.now().strftime('%Y-%m')  # Get the current month as 'YYYY-MM'
                dummy_event, created = Event.objects.get_or_create(
                    title=f'Dummy Event {current_month}',
                    content_manager=content_manager
                )
                stats, created = EventStats.objects.get_or_create(event=dummy_event)
                stats.total_clicks += 1
                stats.save()

            return JsonResponse({'status': 'success'})
        return JsonResponse({'status': 'failure'}, status=400)

    def dashboard_analytics(self):
        if AuthUtils.is_superuser(self.request.user):
            data = facebook_analytics(PAGE_ID, ACCESS_TOKEN)
            context = {'data': data, 'facebook_chart_data': data}

            # Extract post preview data (most liked, commented, and shared posts)
            most_liked_post_message = data['most_liked_post']['message'] if 'message' in data['most_liked_post'] else 'No message'
            most_liked_post_image = data['most_liked_post']['full_picture'] if 'full_picture' in data['most_liked_post'] else None

            most_commented_post_message = data['most_commented_post']['message'] if 'message' in data['most_commented_post'] else 'No message'
            most_commented_post_image = data['most_commented_post']['full_picture'] if 'full_picture' in data['most_commented_post'] else None

            most_shared_post_message = data['most_shared_post']['message'] if 'message' in data['most_shared_post'] else 'No message'
            most_shared_post_image = data['most_shared_post']['full_picture'] if 'full_picture' in data['most_shared_post'] else None

            # Get today's date
            today = timezone.now().date()

            # Fetch the daily visitor count by filtering for today's event (daily event)
            daily_event_title = f'Daily Event {today}'
            daily_event = Event.objects.filter(title=daily_event_title).first()
            daily_visitors = EventStats.objects.filter(event=daily_event).aggregate(Sum('total_visitors'))['total_visitors__sum'] or 0

            # Get the total visitor count by filtering the current month (monthly event)
            current_month = timezone.now().strftime('%Y-%m')
            monthly_event = Event.objects.filter(title=f'Dummy Event {current_month}').first()
            total_visitors = EventStats.objects.filter(event=monthly_event).aggregate(Sum('total_visitors'))['total_visitors__sum'] or 0

            # Get the most liked event
            most_liked_event = Event.objects.annotate(total_likes=Sum('eventstats__total_likes')).order_by('-total_likes').first()

            # Get the most commented event
            most_commented_event = Event.objects.annotate(total_comments=Sum('eventstats__total_comments')).order_by('-total_comments').first()

            

            facebook_pie_data = {
                'reactions': data['total_reactions_count'],
                'comments': data['total_comments'],
                'shares': data['total_shares'],
                'page_views': data['total_page_views']
            }
            
            stats = self.get_total_likes_and_comments()
            context.update(stats)

            website_analytics_data = get_website_analytics_data() 
            website_pie_data = get_website_pie_data()


            print(website_analytics_data)

            current_month = timezone.now().strftime('%Y-%m')

            dummy_event = Event.objects.filter(title=f'Dummy Event {current_month}').first()

            # If the dummy event exists, get the total visitors and clicks for this month
            if dummy_event:
                dummy_event_stats = EventStats.objects.filter(event=dummy_event).first()
                total_visitors = dummy_event_stats.total_visitors if dummy_event_stats else 0
                total_clicks = dummy_event_stats.total_clicks if dummy_event_stats else 0
            else:
                # No event found for the current month, set visitors and clicks to 0
                total_visitors = 0
                total_clicks = 0

            context['total_visitors'] = total_visitors
            context['total_clicks'] = total_clicks
            context['chart_data'] = website_analytics_data
            context['website_pie_data'] = website_pie_data
            context['facebook_pie_data'] = facebook_pie_data
            context['daily_visitors'] = daily_visitors
            context['most_liked_event'] = most_liked_event
            context['most_commented_event'] = most_commented_event
            
            context['most_liked_post_message'] = most_liked_post_message
            context['most_liked_post_image'] = most_liked_post_image

            context['most_commented_post_message'] = most_commented_post_message
            context['most_commented_post_image'] = most_commented_post_image

            context['most_shared_post_message'] = most_shared_post_message
            context['most_shared_post_image'] = most_shared_post_image

            context['most_liked_post'] = data['most_liked_post']
            context['most_commented_post'] = data['most_commented_post']
            context['most_shared_post'] = data['most_shared_post']
                

            return render(self.request, 'content_manager/dashboard_analytics.html', context)
        else:
            return redirect('content_login')

    def add_content_manager(self, request):
        error_message = ""
        if request.method == 'POST':
            form = ContentManagerForm(request.POST)
            if form.is_valid():
                password = request.POST.get('password')
                password2 = request.POST.get('password2')
                if password and password == password2:
                    validators = [
                        UserAttributeSimilarityValidator(),
                        MinimumLengthValidator(min_length=8),
                        CommonPasswordValidator(),
                        NumericPasswordValidator()
                    ]
                    try:
                        for validator in validators:
                            validator.validate(password)
                        user = form.save(commit=False)
                        user.set_password(password)
                        user.save()
                        form.save_m2m()
                        return redirect('list_content_managers')
                    except ValidationError as e:
                        error_message = ', '.join(e.messages)
                else:
                    error_message = 'Passwords do not match.'
        else:
            form = ContentManagerForm()
        return render(request, 'user_management/add_content_manager.html', {
            'form': form,
            'title': 'Add Content Manager',
            'message': error_message
        })

    def edit_content_manager(self, request, pk):
        content_manager = get_object_or_404(ContentManager, pk=pk)
        error_message = ""
        modal_error_message = ""
        form = ContentManagerForm(instance=content_manager)

        if request.method == 'POST':
            if 'delete' in request.POST:
                password = request.POST.get('confirm_password')
                user = authenticate(username=request.user.username, password=password)
                if user is not None:
                    content_manager.delete()
                    return JsonResponse({'success': True, 'redirect_url': reverse('list_content_managers')})
                else:
                    return JsonResponse({'success': False, 'error_message': 'Password incorrect. Please try again.'})
            else:
                form = ContentManagerForm(request.POST, instance=content_manager)
                if form.is_valid():
                    form.save()
                    return redirect('list_content_managers')
                else:
                    error_message = 'Form is not valid. Please correct the errors below.'
        else:
            form = ContentManagerForm(instance=content_manager)
            form.fields['user_permissions'].initial = content_manager.user_permissions.all()

        return render(request, 'user_management/edit_content_manager.html', {
            'form': form,
            'title': 'Edit Content Manager',
            'content_manager': content_manager,
            'message': error_message,
            'modal_error_message': modal_error_message
        })

    def list_content_managers(self, request):
        error_message = ""
        if request.method == 'POST':
            user_ids = request.POST.getlist('selected_users')
            password = request.POST.get('confirm_password')

            if user_ids and password:
                user = authenticate(username=request.user.username, password=password)
                if user is not None:
                    ContentManager.objects.filter(id__in=user_ids).delete()
                    return JsonResponse({'success': True, 'redirect_url': reverse('list_content_managers')})
                else:
                    return JsonResponse({'success': False, 'error_message': 'Password incorrect. Please try again.'})
            else:
                error_message = 'Please select users and enter your password.'

        content_managers = ContentManager.objects.all()
        return render(self.request, 'user_management/user_list.html', {
            'content_managers': content_managers,
            'error_message': error_message
        })

def content_login(request):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.login()

def event_list(request):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.event_list()

def event_detail(request, event_id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.event_detail(event_id)

@csrf_exempt
def like_event(request, event_id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.like_event(event_id)


@csrf_exempt
def add_comment(request, event_id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.add_comment(event_id)

@csrf_exempt
def edit_comment(request, comment_id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.edit_comment(comment_id)

@csrf_exempt
def delete_comment(request, comment_id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.delete_comment(comment_id)

@csrf_exempt
def record_click(request):
    return ContentManagerUtility.record_click(request)

@login_required
def event_posts(request):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.event_posts()

@login_required
@require_POST
def update_event(request, event_id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.update_event(event_id)

@login_required
@require_POST
def remove_photo(request, event_id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.remove_photo(event_id)

@login_required
def event_delete(request, id):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.event_delete(id)

@login_required
def user_logout(request):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.user_logout()

@login_required
@user_passes_test(AuthUtils.is_superuser)
def dashboard_analytics(request):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.dashboard_analytics()

@login_required
@user_passes_test(AuthUtils.is_superuser)
def add_content_manager(request):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.add_content_manager(request)

@login_required
@user_passes_test(AuthUtils.is_superuser)
def edit_content_manager(request, pk):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.edit_content_manager(request, pk)

@login_required
@user_passes_test(AuthUtils.is_superuser)
def list_content_managers(request):
    content_manager_utility = ContentManagerUtility(request)
    return content_manager_utility.list_content_managers(request)
