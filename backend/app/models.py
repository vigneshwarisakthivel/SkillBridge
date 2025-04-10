from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import secrets
from django.utils import timezone
from django.utils.timezone import now
from django.contrib.auth.models import AbstractUser
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('Admin', 'Admin'),
        ('User', 'User'),
    )
    bio = models.TextField(blank=True, null=True)
    name = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    user_token = models.CharField(max_length=64, blank=True, null=True)  # Add this field

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    linkedin = models.URLField(max_length=200, null=True, blank=True)
    status = models.CharField(max_length=20, default='active')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_set",  # Custom related_name to avoid conflict
        blank=True
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions_set",  # Custom related_name to avoid conflict
        blank=True
    )
    
    def generate_token(self):
        import secrets
        self.user_token = secrets.token_hex(16)
        self.save(update_fields=['user_token'])
        
    def __str__(self):
        return f"{self.name} - {self.role}"

class Test(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100)
    max_score = models.IntegerField(default=0)
    subject = models.CharField(max_length=255)
    difficulty = models.CharField(
        max_length=50,
        choices=[("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")]
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    time_limit = models.IntegerField(null=True, blank=True)
    marks_per_question = models.IntegerField(null=True, blank=True)
    pass_criteria = models.FloatField(null=True, blank=True)
    instructions = models.TextField(blank=True, null=True)
    conclusion = models.TextField(blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    due_time = models.TimeField(blank=True, null=True)
    total_marks = models.IntegerField(null=True, blank=True)
    receive_email_notifications = models.BooleanField(default=False)
    notification_emails = models.TextField(blank=True)  # Or CharField if you prefer
    is_public = models.BooleanField(default=True)
    is_proctored = models.BooleanField(default=False)
    allow_retakes = models.BooleanField(default=False)
    allow_feedback = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    total_questions = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    time_limit_per_question = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)  # In minutes

    total_time_limit = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)  # Auto-calculated
    def save(self, *args, **kwargs):
        total_questions = self.total_questions if self.total_questions is not None else 0
        marks_per_question = self.marks_per_question if self.marks_per_question is not None else 0
        self.total_marks = total_questions * marks_per_question
        super().save(*args, **kwargs)


class Question(models.Model):
    QUESTION_TYPES = [
        ('multiplechoice', 'Multiple Choice'),
        ('truefalse', 'True/False'),
        ('fillintheblank', 'Fill in the Blank'),
        ('multipleresponse', 'Multiple Response'),
    ]
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    type = models.CharField(max_length=50, choices=QUESTION_TYPES)
    options = models.JSONField(default=list, blank=True, null=True)  # ✅ Default to empty list
    correct_answer = models.JSONField(default=list, blank=True)
    
class AllowedParticipant(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='allowed_participants')
    email = models.EmailField()

    def __str__(self):
        return f"{self.email} for {self.test.title}"
class Category(models.Model):
    category_name = models.CharField(max_length=255)
    description = models.TextField()
    def __str__(self):
        return self.category_name

class UserPerformance(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_tests = models.IntegerField(default=0)
    total_score = models.IntegerField(default=0)
    def __str__(self):
        return f"{self.user.username} - Tests: {self.total_tests}, Score: {self.total_score}"

class Review(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='reviews')
    question = models.TextField()
    answer = models.CharField(max_length=255)
    correct = models.BooleanField()

class ManageTests(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Draft', 'Draft'),
        ('Completed', 'Completed'),
    ]
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='manage_tests', null=True)
    name = models.CharField(max_length=255)
    duration_date = models.DateField(default=timezone.now)
    duration_time = models.TimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    time_limit = models.PositiveIntegerField()  # Time in minutes
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='managed_tests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.name} - {self.test.title}"
class Option(models.Model):
    question = models.ForeignKey(Question, related_name='option_set', on_delete=models.CASCADE)  # Changed related_name to 'option_set'
    option_text = models.TextField()
    def __str__(self):
        return self.option_text

class Enrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role__iexact': 'User'})
    test = models.ForeignKey(Test, on_delete=models.CASCADE)  # Link to Tests
    enrolled_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.student.name} enrolled"

class Learner(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name

class Assessment(models.Model):
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE)
    score = models.FloatField()
    completed = models.BooleanField(default=False)
    taken_at = models.DateTimeField(auto_now_add=True)

class Feedback(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Feedback from {self.user.name}"

class UserResponse(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    score = models.IntegerField()
    time_taken = models.CharField(max_length=50)  # e.g., '15 mins'
    responses = models.JSONField()
    
    def __str__(self):
        return f"{self.user.username} - {self.test.title}"

from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bio = models.TextField(null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture_url = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    completed_tests_count = models.PositiveIntegerField(default=0)
    total_score = models.PositiveIntegerField(default=0)
    test_history = models.JSONField(default=list)
    achievements_count = models.PositiveIntegerField(default=0)
    leaderboard_rank = models.PositiveIntegerField(blank=True, null=True)
    total_marks = models.IntegerField(default=0)
    rank = models.IntegerField(default=0)
    attempted_tests = models.IntegerField(default=0)

    def __str__(self):
        return self.user.username

    def update_rank(self):
        users = UserProfile.objects.order_by('-total_marks')
        for index, profile in enumerate(users, start=1):
            profile.rank = index
            profile.save()

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:  # Ensure profile is created for all users, including superusers
        UserProfile.objects.get_or_create(user=instance)
    else:
        if hasattr(instance, 'userprofile'):
            instance.userprofile.save()

class UserToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('user', 'User')], default='user')

    def save(self, *args, **kwargs):
        if not self.token:
            while True:
                token = secrets.token_hex(16)
                if not UserToken.objects.filter(token=token).exists():  # ✅ Ensure token uniqueness
                    self.token = token
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class UserTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        user_token = request.headers.get('user_token')

        if not user_token:
            return None  # No authentication provided, move to the next authentication class

        user_token_obj = UserToken.objects.filter(token=user_token).select_related("user").first()

        if not user_token_obj or not user_token_obj.user:
            raise AuthenticationFailed("Invalid or expired user token")

        # (Optional) Check if the token is expired (if you have an expiration field)
        if hasattr(user_token_obj, "expires_at") and user_token_obj.expires_at < now():
            raise AuthenticationFailed("User token has expired")

        return (user_token_obj.user, None)

class OtpVerification(models.Model):  # OTP Verification Model
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
# Activity Log Model
class ActivityLog(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, db_index=True)
    description = models.CharField(max_length=255, verbose_name="Activity Description")
    date = models.DateTimeField(auto_now_add=True)
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, default=1)
    details = models.TextField(default="Default details")
    timestamp = models.DateTimeField(default=now)

    def __str__(self):
        return f"{self.user.name} - {self.description} on {self.date.strftime('%Y-%m-%d %H:%M:%S')}"

# Admin Settings Model
class AdminSettings(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    dark_mode = models.BooleanField(default=False)
    user_management = models.CharField(max_length=255, default="Manage Users")
    access_control = models.CharField(max_length=255, default="Set Permissions")
    system_settings = models.CharField(max_length=255, default="Update Config")
    report_logs = models.CharField(max_length=255, default="Generate Reports")
    security_settings = models.CharField(max_length=255, default="Configure Policies")
    notification_frequency = models.CharField(max_length=255, default="Instant")
    email_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"AdminSettings(id={self.id})"

# Testimonial Model
class Testimonial(models.Model):
    name = models.CharField(max_length=255)
    message = models.TextField()
    profile_picture_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Testimonial by {self.name}"

# Feature Model
class Feature(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.title

class Performer(models.Model):
    name = models.CharField(max_length=255)
    achievement = models.CharField(max_length=255)
    profile_picture_url = models.URLField()
    biography = models.TextField()

    def __str__(self):
        return self.name

# FAQ Model
class FAQ(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()

    def __str__(self):
        return self.question

class AttemptedTest(models.Model):
    STATUS_CHOICES = [
        ("passed", "Passed"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    test = models.ForeignKey("Test", on_delete=models.CASCADE)  # ✅ Ensure ForeignKey link
    title = models.CharField(max_length=255)  # ✅ Store test title separately
    subject = models.CharField(max_length=255)  # ✅ Store test subject separately
    date = models.DateTimeField(auto_now_add=True)
    max_score = models.IntegerField(default=100)
    score = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ongoing")
    rank = models.IntegerField(null=True, blank=True)  # ✅ Rank tracking

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.status})"

class TestResult(models.Model):
    test = models.ForeignKey(Test, null=True, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.CASCADE)
    score = models.IntegerField()
    learner_name = models.CharField(max_length=255, default="Unknown")
    completed_at = models.DateTimeField(default=now)
    completed = models.BooleanField(default=False)

    def __str__(self):
        if self.test:
            return f"{self.user} - {self.test.title} - {self.learner_name} - {self.score}"

        return f"{self.user} - Test not found"

class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

# Password Reset Model
class PasswordReset(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Used', 'Used'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reset_token = models.CharField(max_length=255, unique=True)
    expiration_timestamp = models.DateTimeField()
    status = models.CharField(max_length=7, choices=STATUS_CHOICES, default='Pending')

    def is_expired(self):
        return now() > self.expiration_timestamp

    def __str__(self):
        return f"Password Reset for {self.user.username}"

class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name}"
    
class AdminNotification(models.Model):
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return self.message

# User Settings Model
class UserSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    dark_mode = models.BooleanField(default=False)
    test_access = models.CharField(max_length=10, default='public')  # 'public' or 'private'
    integration = models.CharField(max_length=20, default='none')  # 'none', 'google', 'lms', 'custom'
    auto_save = models.BooleanField(default=True)
    time_reminder = models.IntegerField(default=5)  # in minutes
    notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username}'s settings"

class Achievement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="achievements")
    title = models.CharField(max_length=255)
    details = models.TextField()
    awarded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title}"

class Announcement(models.Model):
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="announcements", null=True, blank=True)
    title = models.CharField(max_length=255)
    message = models.TextField()
    audience = models.CharField(
        max_length=50, 
        choices=[("all", "All Users"), ("students", "Students Only")]
    )
    date = models.DateField()
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}"

class TestSummary(models.Model):
    title = models.CharField(max_length=255)
    average_score = models.FloatField()
    total_users = models.IntegerField()
    median_score = models.FloatField()  # Added median score
    pass_rate = models.FloatField()     # Added pass rate
    total_attempts = models.IntegerField()  # Added total attempts

    def __str__(self):
        return self.title

class CompletedTest(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="completed_tests")
    test_id = models.CharField(max_length=100)
    test_name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)
    score = models.FloatField()
    improvement = models.FloatField()
    status = models.CharField(max_length=20, choices=[("Passed", "Passed"), ("Failed", "Failed")])

    def __str__(self):
        return f"{self.user.username} - {self.test_name} ({self.status})"
    
class TestUser(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name  
from django.utils import timezone

def save_completed_test(user, test_attempt):
    """
    Save a test attempt as a completed test only if it's actually completed.
    """
    if test_attempt.status == "completed" and test_attempt.score is not None:
        CompletedTest.objects.create(
            user=user,
            test_id=test_attempt.id,
            test_name=test_attempt.test_name,
            date=timezone.now(),
            subject=test_attempt.subject,
            score=test_attempt.score,
            improvement=calculate_improvement(user, test_attempt),  # Define this function
            status="Passed" if test_attempt.score >= 50 else "Failed"
        )
def calculate_improvement(user, test_attempt):
    """
    Calculate score improvement from the user's previous test attempts.
    """
    previous_attempts = CompletedTest.objects.filter(user=user, test_id=test_attempt.id).order_by('-date')

    if previous_attempts.exists():
        last_score = previous_attempts.first().score
        return test_attempt.score - last_score
    return 0  # No previous attempts


class PerformanceStat(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)  # Test or category name
    score = models.FloatField()

    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.score}%)"

class RecentActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.CharField(max_length=255)  # "Attempted Math Test"
    details = models.TextField()  # "Scored 85% in Algebra Test"
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.description} ({self.timestamp})"
    
class PerformanceHistory(models.Model): 
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # ✅ Add this line
    username = models.CharField(max_length=255)
    test_title = models.CharField(max_length=255)
    attempted_test_id = models.CharField(max_length=255)
    attempt_date = models.DateTimeField()
    total_score = models.FloatField()
    total_questions = models.IntegerField()
    time_taken = models.DurationField()
    passed = models.BooleanField()
    can_reattempt = models.BooleanField()
    answers = models.JSONField()

    def __str__(self):
        return f"{self.user.username} - {self.test_title} - {self.attempt_date}"
    
class LeaderboardEntry(models.Model):
    user_id = models.IntegerField()
    username = models.CharField(max_length=100)
    test_name = models.CharField(max_length=255)
    rank = models.IntegerField()
    score = models.IntegerField()
    badges = models.JSONField()  # Store badges as a list

    def __str__(self):
        return f"{self.username} - {self.test_name}"

class UserResponses(models.Model):
    test_name = models.CharField(max_length=255)
    question = models.TextField()
    correct = models.BooleanField(default=False)
    incorrect = models.BooleanField(default=False)
    attempts = models.IntegerField()

    def __str__(self):
        return f"{self.test_name} - {self.question}"


class TestAttempt(models.Model):
    STATUS_CHOICES = [
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('in_progress', 'In Progress'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    total_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)  # ✅ Number of correct answers
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default="in_progress")

    # ✅ Extra fields needed for attempted test tracking
    microphone = models.BooleanField(default=False)  # ✅ Track if microphone was enabled
    location = models.BooleanField(default=False)  # ✅ Track if location was enabled
    network = models.BooleanField(default=False)  # ✅ Track if network was enabled
    phone = models.BooleanField(default=False)  # ✅ Track if phone usage was detected
    timestamp = models.DateTimeField(auto_now_add=True)

    # ✅ User Performance Statistics
    highest_score = models.FloatField(default=0)  # ✅ Track highest score across attempts
    accuracy = models.FloatField(default=0)  # ✅ Track user accuracy percentage
    certificates_earned = models.IntegerField(default=0)  # ✅ Track certificates earned
    rank = models.IntegerField(null=True, blank=True)  # ✅ User rank based on test performance
    is_completed = models.BooleanField(default=False)  # Track test completion
    completed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Mark as completed only if end_time is set
        if self.end_time is not None and self.score is not None:
            self.status = "completed"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.test.title} ({self.status})({'Completed' if self.is_completed else 'In Progress'})"
   

class UserAnswer(models.Model):
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.JSONField()

    def __str__(self):
        return f"Answer: {self.selected_option} for {self.question.text[:50]}"
    
class Answer(models.Model):
    test_attempt = models.ForeignKey(TestAttempt, related_name='answer', on_delete=models.CASCADE)
    question = models.CharField(max_length=255)
    answer = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)