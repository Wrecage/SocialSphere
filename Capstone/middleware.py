from django.utils.deprecation import MiddlewareMixin
from SocialSphere.models import Event, EventStats, ContentManager

class VisitorCountMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not request.session.session_key:
            request.session.save()

        # Only increment visitor count if this is the first visit in this session
        if request.path == '/' and not request.session.get('has_visited'):
            request.session['has_visited'] = True
            # Use a dummy event with ID 1 to track total visitors
            content_manager = ContentManager.objects.first()  # Assuming there is at least one content manager
            if content_manager:
                dummy_event, created = Event.objects.get_or_create(
                    id=1,
                    defaults={'title': 'Dummy Event', 'content_manager': content_manager}
                )
                stats, created = EventStats.objects.get_or_create(event=dummy_event)
                stats.total_visitors += 1
                stats.save()