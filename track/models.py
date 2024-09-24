from django.contrib.auth.models import AbstractUser
from datetime import timedelta
from django.utils import timezone
from django.db import models

# Create your models here.
class User(AbstractUser):
    
    def __str__(self):
        return f'{self.username}, {self.email}'
    
    @classmethod
    def is_unique(cls, username):
        return not cls.objects.filter(username=username).exists()

class Goal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    def total_time_spend(self):
        """
        Returns the total time spent on this goal by summing up
        the total_time_spent from all related steps.
        """

        total_time = self.steps.aggregate(total=models.Sum('total_time_spend'))['total']
        return total_time.total_seconds() / 3600 if total_time else 0.0
    
    def thours_week(self):
        """
        Returns the total time spent on this goal during the current week
        by summing the weekly time from all related steps.
        """
        total_week_time = timedelta(0)
        for step in self.steps.all():
            total_week_time += step.time_spend_this_week()
        return total_week_time.total_seconds() / 3600 if total_week_time else 0.0
    
    def thours_week_planned(self):
        """
        Return the planned hours for the goal in a week
        """
        planned_hours = timedelta(0)
        for step in self.steps.all():
            planned_hours += step.hours_week
        return planned_hours.total_seconds() / 3600 if planned_hours else 0.0
    
    def hours_today(self):
        """
        Returns total hours spend on this goal today
        """
        today_hours = timedelta(0)
        for step in self.steps.all():
            today_hours += step.time_spend_today()
        return today_hours.total_seconds() / 3600.0


class Step(models.Model):
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='steps')
    step_title = models.CharField(max_length=255)
    total_time_spend = models.DurationField(default=timedelta(0), null=True, blank=True)
    hours_week = models.DurationField(default=timedelta(0), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.step_title
    
    def update_total_time(self):
        total_time = self.time_logs.aggregate(total=models.Sum('duration'))['total'] or timedelta(0)
        self.total_time_spend = total_time
        self.save()

    def time_spend_today(self):
        today = timezone.now().date()
        time_logs_today = self.time_logs.filter(start_time__date=today)
        total_today = time_logs_today.aggregate(total=models.Sum('duration'))['total'] or timedelta(0)
        return total_today
    
    def time_spend_this_week(self):
        today = timezone.now()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

        time_logs_week = self.time_logs.filter(start_time__gte=start_of_week)
        total_week = time_logs_week.aggregate(total=models.Sum('duration'))['total'] or timedelta(0)
        return total_week
        

class TimeLog(models.Model):
    step = models.ForeignKey(Step, on_delete=models.CASCADE, related_name='time_logs')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    duration = models.DurationField(blank=True, null=True)
    
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        self.step.update_total_time()