from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.contrib import admin
from rest_framework.authtoken.models import Token

@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'key', 'created') 
    search_fields = ['user__username', 'user__email']  

class Role(models.Model):
    role_name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.role_name

class User(AbstractUser):
    password = models.CharField(max_length=255, default='')
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )

   
    date_of_birth = models.DateField()
    profile_picture_url = models.URLField(max_length=255, blank=True, null=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=8, choices=STATUS_CHOICES, default='Active')

    
    groups = models.ManyToManyField(
        Group,
        related_name='myapp_user_set',  # Change related_name to avoid clashes
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='myapp_user_permissions_set',  # Change related_name to avoid clashes
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username

class Category(models.Model):
    category_name = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return self.category_name

class Test(models.Model):
    DIFFICULTY_CHOICES = (
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    subject = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=6, choices=DIFFICULTY_CHOICES)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    time_limit = models.IntegerField()  # in minutes
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('Multiple Choice', 'Multiple Choice'),
        ('True/False', 'True/False'),
        ('Short Answer', 'Short Answer'),
    )
    DIFFICULTY_CHOICES = (
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
    )

    question_text = models.TextField()
    subject = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=6, choices=DIFFICULTY_CHOICES)
    question_type = models.CharField(max_length=15, choices=QUESTION_TYPE_CHOICES)
    answer_choices = models.JSONField(blank=True, null=True)  # only for multiple choice questions
    correct_answer = models.CharField(max_length=255)
    tags = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question_text

class TestQuestion(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    question_order = models.IntegerField()
    points = models.IntegerField()

    class Meta:
        unique_together = ('test', 'question')

class TestAttempt(models.Model):
    STATUS_CHOICES = (
        ('Completed', 'Completed'),
        ('Ongoing', 'Ongoing'),
        ('Failed', 'Failed'),
    )

    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    score = models.IntegerField()
    time_taken = models.IntegerField()  # in minutes
    created_at = models.DateTimeField(auto_now_add=True)

class TestResult(models.Model):
    test_attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE)
    score = models.IntegerField()
    detailed_breakdown = models.TextField()
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class ProctoringSession(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Completed', 'Completed'),
        ('Interrupted', 'Interrupted'),
    )

    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=11, choices=STATUS_CHOICES)  # Updated max_length
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProctoringLog(models.Model):
    session = models.ForeignKey(ProctoringSession, on_delete=models.CASCADE)
    timestamp = models.DateTimeField()
    event_type = models.CharField(max_length=255)
    description = models.TextField()

class Leaderboard(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField()
    ranking = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    date_earned = models.DateTimeField(auto_now_add=True)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    completed_tests_count = models.IntegerField(default=0)
    total_score = models.IntegerField(default=0)
    test_history = models.JSONField(blank=True, null=True)
    achievements_count = models.IntegerField(default=0)

class Notification(models.Model):
    STATUS_CHOICES = (
        ('Read', 'Read'),
        ('Unread', 'Unread'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=6, choices=STATUS_CHOICES)  # Updated max_length
    created_at = models.DateTimeField(auto_now_add=True)

class PasswordReset(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Used', 'Used'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reset_token = models.CharField(max_length=255)
    expiration_timestamp = models.DateTimeField()
    status = models.CharField(max_length=7, choices=STATUS_CHOICES)  # Updated max_length

class AnalyticsReport(models.Model):
    report_type = models.CharField(max_length=255)
    report_data = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)

class TestProctoringSetting(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    enable_webcam_monitoring = models.BooleanField(default=False)
    enable_ai_monitoring = models.BooleanField(default=False)
    time_limit_warning = models.IntegerField()  # in minutes
    allowed_browser_types = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class QuestionImportLog(models.Model):
    STATUS_CHOICES = (
        ('Successful', 'Successful'),
        ('Failed', 'Failed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()  # in bytes
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)  # Updated max_length
    errors = models.TextField(blank=True, null=True)
    import_timestamp = models.DateTimeField(auto_now_add=True)

class UserActivityLog(models.Model):
    activity_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.activity_type} - {self.timestamp}"



