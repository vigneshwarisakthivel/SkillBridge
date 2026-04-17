from django.db.models.signals import post_save, post_delete
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import *

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


def _log(owner, type_, text, detail=""):
    """Helper — silently creates an ActivityLog, skips if owner is None."""
    if owner is None:
        return
    ActivityLog.objects.create(owner=owner, type=type_, text=text, detail=detail)


# ── Tests ─────────────────────────────────────────────────────────────────────

@receiver(post_save, sender=Test)
def log_test_save(sender, instance, created, **kwargs):
    action = "created" if created else f"moved to {instance.status}"
    _log(
        instance.owner,
        "test",
        f'Test "{instance.title}" {action}',
        f"By: {instance.owner.get_full_name() or instance.owner.username if instance.owner else 'Admin'}",
    )


@receiver(post_delete, sender=Test)
def log_test_delete(sender, instance, **kwargs):
    _log(instance.owner, "test", f'Test "{instance.title}" deleted', "By: Admin")



# ── Assignments (attempts + scores) ───────────────────────────────────────────

@receiver(post_save, sender=TestAssignment)
def log_assignment_save(sender, instance, created, **kwargs):
    owner = instance.test.owner
    name  = instance.candidate.name
    title = instance.test.title

    if created:
        _log(owner, "attempt", f"{name} was assigned {title}", f"Test: {title}")
        return

    if instance.status == "completed":
        if instance.score is not None:
            _log(owner, "score", f"{name} scored {instance.score}% on {title}", f"Score: {instance.score}%")
        else:
            _log(owner, "attempt", f"{name} completed {title}", "Score: pending")


# ── Users ─────────────────────────────────────────────────────────────────────

@receiver(post_save, sender=User)
def log_user_save(sender, instance, created, **kwargs):
    if not created:
        return
    # Log for all admins who might be watching — or just store without owner
    # Here we store owner=instance (the user themselves) and admins fetch all
    ActivityLog.objects.create(
        owner=instance,
        type="user",
        text=f"{instance.get_full_name() or instance.username} registered",
        detail="Role: Student",
    )