from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *
import base64
import uuid

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
 
class RegisterSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [ 'email', 'password', 'fullName']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        full_name = validated_data.pop('fullName')
        email = validated_data.get('email')

        user = User.objects.create_user(
            username=email,  # use email as username
            email=email,
            password=validated_data['password']
        )

        user.first_name = full_name
        user.save()

        return user

class ProfileSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    # ✅ FIXED: get name from fullName (first_name)
    name = serializers.CharField(source="user.first_name")

    role = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ["image", "name", "role"]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_role(self, obj):
        if obj.user.is_superuser:
            return "Super User"
        elif obj.user.is_staff:
            return "Admin"
        return "Admin"   

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class QuestionBankSerializer(serializers.ModelSerializer):
    """Used for standalone question bank questions (no test required)."""
    used_in_tests = serializers.SerializerMethodField()
    class Meta:
        model = Question
        fields = ["id", "text", "type", "options", "correct_answer", "created_at","used_in_tests"]
        read_only_fields = ["id", "created_at"]

    def get_used_in_tests(self, obj):
        return Question.objects.filter(
            text__iexact=obj.text.strip(),
            test__isnull=False
        ).count()

class TestListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested questions)."""
    question_count = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    questions = QuestionBankSerializer(many=True, read_only=True)
    # ✅ ADD THESE
    attempt_count = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = [
            "id", "title", "description", "category", "subject", "difficulty",
            "status", "is_public", "total_marks", "pass_criteria",
            "start_date", "end_date", "created_at", "updated_at",
            "question_count", "owner_name", "rank", "questions",

            # ✅ ADD HERE
            "attempt_count",
            "duration",
        ]

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_owner_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return "—"

    # ✅ NEW METHODS

    def get_attempt_count(self, obj):
        return obj.assignments.count()   # uses related_name="assignments"

    def get_duration(self, obj):
        return obj.total_time_limit  # or format if needed
 
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model   = Question
        fields  = "__all__"
 
class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Test
        fields = "__all__" 

class TestDetailSerializer(serializers.ModelSerializer):
    """Full serializer including nested questions."""
    questions = QuestionBankSerializer(many=True, required=False)
    owner_name = serializers.SerializerMethodField()
 
    class Meta:
        model = Test
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "secure_uuid"]
 
    def get_owner_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return "—"
 
    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        # Generate a secure UUID for the test link
        raw_uuid = str(uuid.uuid4())
        encoded = base64.urlsafe_b64encode(raw_uuid.encode()).decode()
        test = Test.objects.create(**validated_data, secure_uuid=encoded)
        for q in questions_data:
            Question.objects.create(test=test, **q)
        return test
 
    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if questions_data is not None:
            instance.questions.all().delete()
            for q in questions_data:
                Question.objects.create(test=instance, **q)
        return instance
 
 
class AllowedEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedEmail
        fields = ["id", "email", "created_at"]
        read_only_fields = ["id", "created_at"]
 
 
class UploadAllowedEmailsSerializer(serializers.Serializer):
    test_id = serializers.IntegerField()
    emails = serializers.ListField(
        child=serializers.EmailField(),
        allow_empty=False,
    )
 
 
class SecureUUIDSerializer(serializers.Serializer):
    encoded_uuid = serializers.CharField()
 
class BulkQuestionBankSerializer(serializers.Serializer):
    """Accepts a list of questions and saves them all at once."""
    questions = QuestionBankSerializer(many=True)

    def validate_questions(self, value):
        if not value:
            raise serializers.ValidationError("At least one question is required.")
        for q in value:
            if not q.get("text", "").strip():
                raise serializers.ValidationError("All questions must have text.")
            if q.get("type") == "multipleresponse":
                answers = q.get("correct_answer", [])
                if not answers or (isinstance(answers, list) and len(answers) == 0):
                    raise serializers.ValidationError(
                        "Multiple response questions must have at least one correct answer."
                    )
        return value
    
class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ["id", "name", "email", "created_at"]
        read_only_fields = ["id", "created_at"]


class TestAssignmentSerializer(serializers.ModelSerializer):
    # Flattened fields your frontend expects directly on the row
    candidate_name  = serializers.CharField(source="candidate.name",  read_only=True)
    candidate_email = serializers.CharField(source="candidate.email", read_only=True)
    assigned_test   = serializers.CharField(source="test.title",      read_only=True)
    assigned_date   = serializers.DateField(source="assignment_date_display", read_only=True)
    test_status     = serializers.SerializerMethodField()

    class Meta:
        model = TestAssignment
        fields = [
            "id",
            "candidate", "candidate_name", "candidate_email",
            "test",      "assigned_test",
            "status",    "test_status",
            "score",
            "assigned_date",
            "completed_at","selection_sent"
        ]
        read_only_fields = ["id", "assigned_date", "completed_at"]

    def get_test_status(self, obj):
        # Map backend status → display label your frontend uses
        return "Completed" if obj.status == "completed" else "Not Completed"

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Format assigned_date as "Mar 15, 2026" to match frontend display
        if instance.assigned_date:
            rep["assigned_date"] = instance.assigned_date.strftime("%b %d, %Y")
        return rep


class BulkAssignSerializer(serializers.Serializer):
    """Assign one test to multiple candidates at once."""
    test_id      = serializers.IntegerField()
    candidate_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)


class SendReminderSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    message       = serializers.CharField()


class ReminderLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderLog
        fields = ["id", "message", "sent_at"]
        read_only_fields = ["id", "sent_at"]
    
class ActivityLogSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ["id", "type", "text", "detail", "time", "date", "created_at"]
        read_only_fields = ["id", "created_at", "time", "date"]

    def get_time(self, obj):
        return obj.time_ago

    def get_date(self, obj):
        return obj.date_group
    
class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp   = serializers.CharField(min_length=4, max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    otp      = serializers.CharField(min_length=4, max_length=6)
    password = serializers.CharField(min_length=8)
    confirm  = serializers.CharField(min_length=8)

    def validate(self, data):
        if data["password"] != data["confirm"]:
            raise serializers.ValidationError({"confirm": "Passwords do not match."})

        pw = data["password"]
        if not any(c.isupper() for c in pw):
            raise serializers.ValidationError({"password": "Must include uppercase letter."})
        if not any(c.isdigit() for c in pw):
            raise serializers.ValidationError({"password": "Must include a number."})
        if not any(not c.isalnum() for c in pw):
            raise serializers.ValidationError({"password": "Must include a special character."})
        return data
    
class MalpracticeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MalpracticeLog
        fields = ["id", "event_type", "student_id", "created_at"]
        read_only_fields = ["id", "created_at"]


class TestSubmissionSerializer(serializers.Serializer):
    """
    Accepts the student's answers and scores them server-side.
    answers format: { "question_id": "answer_value", ... }
    """
    test_id     = serializers.IntegerField()
    answers     = serializers.DictField()
    time_taken  = serializers.IntegerField(required=False, default=0)
    alert_count = serializers.IntegerField(required=False, default=0)
    force_exited = serializers.BooleanField(required=False, default=False)
    candidate_id = serializers.IntegerField(required=False, allow_null=True)