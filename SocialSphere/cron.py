from django_cron import CronJobBase, Schedule
from .models import Event, EventStats
from django.utils import timezone

class ResetDailyVisitorsCronJob(CronJobBase):
    RUN_AT_TIMES = ['00:00']  # Run at midnight

    schedule = Schedule(run_at_times=RUN_AT_TIMES)
    code = 'SocialSphere.reset_daily_visitors'  # This code should be unique within the project

    def do(self):
        today = timezone.now().date()
        # Clear today's daily event visitor count by updating total_visitors to 0 for today's event
        EventStats.objects.filter(event__title__startswith=f'Daily Event {today}').update(total_visitors=0)
