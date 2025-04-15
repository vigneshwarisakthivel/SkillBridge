
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Announcement, Notification

User = get_user_model()

@receiver(post_save, sender=Announcement)
def create_notifications(sender, instance, created, **kwargs):
    if created:  # Ensure notifications are only created when a new announcement is added
        users = User.objects.all()

        for user in users:
            # ✅ Prevent duplicate notifications
            if not Notification.objects.filter(user=user, announcement=instance).exists():
                Notification.objects.create(user=user, announcement=instance)
