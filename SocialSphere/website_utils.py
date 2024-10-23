from datetime import datetime, timedelta
import calendar
from django.db.models import Sum
from django.utils import timezone
from .models import EventStats, Event

def get_website_analytics_data():
    """Calculate and return the monthly website analytics data for the past 6 months."""
    
    today = timezone.now()  # Get the current time (timezone-aware)
    labels = []
    monthly_visitors = []
    monthly_clicks = []
    monthly_comments = []
    monthly_likes = []

    # Loop through the last 6 months, including the current month
    for i in range(5, -1, -1):
        # Get the first and last day of the month
        month = (today.month - i - 1) % 12 + 1
        year = today.year + ((today.month - i - 1) // 12)
        month_start = datetime(year, month, 1)
        month_end = datetime(year, month, calendar.monthrange(year, month)[1])

        # Convert to timezone-aware objects
        month_start = timezone.make_aware(month_start, timezone.get_current_timezone())
        month_end = timezone.make_aware(month_end, timezone.get_current_timezone()) + timedelta(days=1) - timedelta(seconds=1)

        # Add the label for the month
        labels.append(month_start.strftime("%B %Y"))

        # Get the dummy event for this month
        dummy_event = Event.objects.filter(title=f'Dummy Event {month_start.strftime("%Y-%m")}').first()

        if dummy_event:
            monthly_stats = EventStats.objects.filter(event=dummy_event)
            visitors_sum = monthly_stats.aggregate(Sum('total_visitors'))['total_visitors__sum'] or 0
            clicks_sum = monthly_stats.aggregate(Sum('total_clicks'))['total_clicks__sum'] or 0
        else:
            visitors_sum = 0
            clicks_sum = 0

        # Aggregate stats for likes and comments
        monthly_stats = EventStats.objects.filter(event__date__range=[month_start, month_end])
        comments_sum = monthly_stats.aggregate(Sum('total_comments'))['total_comments__sum'] or 0
        likes_sum = monthly_stats.aggregate(Sum('total_likes'))['total_likes__sum'] or 0

        # Append the monthly sums to the lists
        monthly_visitors.append(visitors_sum)
        monthly_clicks.append(clicks_sum)
        monthly_comments.append(comments_sum)
        monthly_likes.append(likes_sum)

    # Return the structured data for charting
    return {
        'labels': labels,  # Month labels for the past 6 months
        'visitors': monthly_visitors,
        'clicks': monthly_clicks,
        'comments': monthly_comments,
        'likes': monthly_likes,
    }

def get_website_pie_data():
    """Fetch the total counts for visitors, clicks, comments, and likes for pie chart display."""
    
    today = timezone.now()
    total_visitors = 0
    total_clicks = 0
    
    # Loop through all the dummy events of the past 6 months and aggregate total visitors and clicks
    for i in range(5, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year = today.year + ((today.month - i - 1) // 12)
        month_start = datetime(year, month, 1)
        
        # Get the dummy event for this month
        dummy_event = Event.objects.filter(title=f'Dummy Event {month_start.strftime("%Y-%m")}').first()
        
        if dummy_event:
            monthly_stats = EventStats.objects.filter(event=dummy_event)
            total_visitors += monthly_stats.aggregate(Sum('total_visitors'))['total_visitors__sum'] or 0
            total_clicks += monthly_stats.aggregate(Sum('total_clicks'))['total_clicks__sum'] or 0

    # Aggregate total comments and likes from all events
    total_comments = EventStats.objects.aggregate(Sum('total_comments'))['total_comments__sum'] or 0
    total_likes = EventStats.objects.aggregate(Sum('total_likes'))['total_likes__sum'] or 0

    return {
        'visitors': total_visitors,
        'clicks': total_clicks,
        'comments': total_comments,
        'likes': total_likes,
    }