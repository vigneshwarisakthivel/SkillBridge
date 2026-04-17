from django.db import models
from django.contrib.auth.models import User
import random
import string
from django.utils import timezone
from datetime import timedelta

# ✅ Profile Image
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='profiles/', null=True, blank=True)

    def __str__(self):
        return self.user.username


# ✅ Notifications
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text
    
class Test(models.Model):
    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("closed", "Closed"),
    ]
    CATEGORY_CHOICES = [
        ("math", "Mathematics"),
        ("science", "Science"),
        ("history", "History"),
        ("literature", "Literature"),
        ("technology", "Technology"),
        ("language", "Language"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="other")
    subject = models.CharField(max_length=255)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default="medium")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tests", null=True, blank=True)

    # Scoring & Time
    max_score = models.FloatField(default=0)
    total_marks = models.FloatField(default=0)
    marks_per_question = models.FloatField(default=1)
    time_limit_per_question = models.FloatField(default=1, help_text="Minutes per question")
    total_time_limit = models.FloatField(default=0, help_text="Total time in minutes")

    # Pass Criteria
    pass_criteria = models.FloatField(default=50, help_text="Percentage required to pass")

    # Content
    instructions = models.TextField(blank=True, default="")
    conclusion = models.TextField(blank=True, default="")

    # Availability
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    due_time = models.TimeField(null=True, blank=True)
    scheduled_date = models.DateField(null=True, blank=True)

    # Navigation & Behaviour
    allow_jump_around = models.BooleanField(default=False)
    only_move_forward = models.BooleanField(default=False)
    randomize_order = models.BooleanField(default=False)
    allow_blank_answers = models.BooleanField(default=False)
    penalize_incorrect_answers = models.BooleanField(default=False)

    # Browser Security
    disable_right_click = models.BooleanField(default=False)
    disable_copy_paste = models.BooleanField(default=False)
    disable_translate = models.BooleanField(default=False)
    disable_autocomplete = models.BooleanField(default=False)
    disable_spellcheck = models.BooleanField(default=False)
    disable_printing = models.BooleanField(default=False)

    # Retakes & Access
    allow_retakes = models.BooleanField(default=False)
    number_of_retakes = models.IntegerField(default=1)
    is_public = models.BooleanField(default=False)

    # Notifications
    receive_email_notifications = models.BooleanField(default=False)
    notification_emails = models.TextField(blank=True, default="")

    # Meta
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    rank = models.IntegerField(default=1)
    secure_uuid = models.CharField(max_length=255, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Question(models.Model):
    TYPE_CHOICES = [
        ("multiplechoice",   "Multiple Choice"),
        ("multipleresponse", "Multiple Response"),
        ("truefalse",        "True / False"),
        ("fillintheblank",   "Fill in the Blank"),
    ]

    test = models.ForeignKey(
        Test, on_delete=models.CASCADE,
        related_name="questions",
        null=True, blank=True  # ← must be nullable for standalone bank questions
    )
    owner = models.ForeignKey(   # ← ADD THIS so bank questions know who owns them
        User, on_delete=models.CASCADE,
        related_name="bank_questions",
        null=True, blank=True
    )
    text = models.TextField()
    order = models.IntegerField(default=0) 
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    options = models.JSONField(default=list, blank=True)
    correct_answer = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"[{self.type}] {self.text[:60]}"


class AllowedEmail(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name="allowed_emails")
    email = models.EmailField()
    passcode = models.CharField(max_length=10)
    is_used = models.BooleanField(default=False) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("test", "email")

    def __str__(self):
        return f"{self.email} → {self.test.title}"
    
class Candidate(models.Model):
    """
    A candidate is a person who takes tests.
    Linked to a User account if they register, or stored by email only.
    """
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name="candidates",
        help_text="The admin/teacher who added this candidate"
    )
    name  = models.CharField(max_length=255)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("owner", "email")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} <{self.email}>"


class TestAssignment(models.Model):
    """
    Links a candidate to a specific test (the 'assigned test' column).
    """
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("completed",   "Completed"),
    ]

    candidate     = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="assignments")
    test          = models.ForeignKey(Test,      on_delete=models.CASCADE, related_name="assignments")
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    score         = models.FloatField(null=True, blank=True, help_text="Percentage score 0-100")
    assigned_date = models.DateField(auto_now_add=True)
    completed_at  = models.DateTimeField(null=True, blank=True)
    selection_sent = models.BooleanField(default=False)
    class Meta:
        unique_together = ("candidate", "test")
        ordering = ["-assigned_date"]

    def __str__(self):
        return f"{self.candidate.name} → {self.test.title} ({self.status})"


class ReminderLog(models.Model):
    """
    Tracks every reminder email sent to a candidate for a test.
    """
    assignment = models.ForeignKey(TestAssignment, on_delete=models.CASCADE, related_name="reminders")
    sent_by    = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_reminders")
    message    = models.TextField()
    sent_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-sent_at"]

    def __str__(self):
        return f"Reminder → {self.assignment.candidate.name} at {self.sent_at:%Y-%m-%d %H:%M}"
    
class ActivityLog(models.Model):
    TYPE_CHOICES = [
        ("attempt",  "Attempt"),
        ("score",    "Score"),
        ("user",     "User"),
        ("test",     "Test"),
        ("question", "Question"),
    ]

    owner  = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name="activity_logs",
        help_text="The admin who owns this log entry"
    )
    type   = models.CharField(max_length=20, choices=TYPE_CHOICES)
    text   = models.TextField()
    detail = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] {self.text[:60]}"

    @property
    def time_ago(self):
        """Human-readable relative time — matches your frontend 'time' field."""
        from django.utils import timezone
        from datetime import timedelta
        now   = timezone.now()
        delta = now - self.created_at
        if delta < timedelta(minutes=1):
            return "just now"
        if delta < timedelta(hours=1):
            m = int(delta.seconds / 60)
            return f"{m} min ago"
        if delta < timedelta(days=1):
            h = int(delta.seconds / 3600)
            return f"{h} hr ago"
        if delta < timedelta(days=2):
            return "Yesterday"
        return f"{delta.days} days ago"

    @property
    def date_group(self):
        """Groups events into Today / Yesterday / Earlier — matches your frontend 'date' field."""
        from django.utils import timezone
        from datetime import timedelta
        now   = timezone.now().date()
        delta = now - self.created_at.date()
        if delta.days == 0:
            return "Today"
        if delta.days == 1:
            return "Yesterday"
        return "Earlier"
    

class PasswordResetOTP(models.Model):
    email      = models.EmailField()
    otp        = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used    = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def is_expired(self):
        """OTP expires after 10 minutes."""
        return timezone.now() > self.created_at + timedelta(minutes=10)

    @classmethod
    def generate_otp(cls):
        return "".join(random.choices(string.digits, k=6))

    def __str__(self):
        return f"{self.email} — {self.otp} ({'used' if self.is_used else 'active'})"
    
class MalpracticeLog(models.Model):
    EVENT_CHOICES = [
        ("no_face",        "No Face Detected"),
        ("multiple_faces", "Multiple Faces Detected"),
        ("eye_movement",   "Eye Movement Detected"),
        ("head_turned_left",  "Head Turned Left"),
        ("head_turned_right", "Head Turned Right"),
        ("talking_detected",  "Talking Detected"),
        ("object_detected",   "Object Detected"),
    ]

    test      = models.ForeignKey(Test,      on_delete=models.CASCADE, related_name="malpractice_logs")
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="malpractice_logs", null=True, blank=True)
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_type} — test {self.test_id} at {self.created_at:%Y-%m-%d %H:%M}"


class TestSubmission(models.Model):
    test          = models.ForeignKey(Test,      on_delete=models.CASCADE, related_name="submissions")
    candidate     = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="submissions", null=True, blank=True)
    answers       = models.JSONField(default=dict)
    score         = models.FloatField(null=True, blank=True)
    total_marks   = models.FloatField(null=True, blank=True)
    percentage    = models.FloatField(null=True, blank=True)
    passed        = models.BooleanField(null=True, blank=True)
    time_taken    = models.IntegerField(null=True, blank=True, help_text="Seconds taken to complete")
    submitted_at  = models.DateTimeField(auto_now_add=True)
    alert_count   = models.IntegerField(default=0)
    force_exited  = models.BooleanField(default=False)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Submission — {self.test.title} — {self.percentage}%"