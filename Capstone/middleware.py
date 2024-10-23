from django.utils.deprecation import MiddlewareMixin
from SocialSphere.models import Event, EventStats, ContentManager
from django.utils import timezone

class VisitorCountMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not request.session.session_key:
            request.session.save()

        # Track daily visits by using 'has_visited_today'
        today_date = timezone.now().strftime('%Y-%m-%d')



        # Check if it's midnight based on timezone
        now = timezone.now()
        if now.hour == 0 and now.minute == 0:  # 12:00 AM midnight check
            # Reset daily visitors to zero at 12:00 AM
            EventStats.objects.filter(event__title__startswith='Daily Event').update(total_visitors=0)
            print(f"Daily visitors count reset to 0 for {today_date}")
            

        if request.path == '/' and request.session.get('visited_date') != today_date:
            # Update the session to mark today's visit
            request.session['visited_date'] = today_date

            # Track total visitors for the landing page (using a dummy event)
            content_manager = ContentManager.objects.first()  # Assuming at least one content manager
            if content_manager:
                # Create or get a dummy event for the current month (monthly tracking)
                current_month = timezone.now().strftime('%Y-%m')  # Get the current month as 'YYYY-MM'
                monthly_event, _ = Event.objects.get_or_create(
                    title=f'Dummy Event {current_month}',
                    content_manager=content_manager
                )

                # Create or get daily event to track daily visitors
                daily_event, _ = Event.objects.get_or_create(
                    title=f'Daily Event {today_date}',
                    content_manager=content_manager
                )

                # Update visitor counts for both monthly and daily stats
                monthly_stats, _ = EventStats.objects.get_or_create(event=monthly_event)
                monthly_stats.total_visitors += 1
                monthly_stats.save()

                daily_stats, _ = EventStats.objects.get_or_create(event=daily_event)
                daily_stats.total_visitors += 1
                daily_stats.save()



class FreshSessionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # If no session exists or the session is new, flush the session to ensure it's fresh
        if not request.session.session_key or not request.session.exists(request.session.session_key):
            request.session.flush()  # This will create a new session

        response = self.get_response(request)
        return response
