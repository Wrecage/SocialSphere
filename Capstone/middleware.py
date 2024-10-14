from django.utils.deprecation import MiddlewareMixin
from SocialSphere.models import Event, EventStats, ContentManager
from django.utils import timezone

class VisitorCountMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not request.session.session_key:
            request.session.save()

        # Track daily visits by using 'has_visited_today'
        today_date = timezone.now().strftime('%Y-%m-%d')

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

