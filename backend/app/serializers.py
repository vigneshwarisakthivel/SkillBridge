from rest_framework import serializers
from .models import Test, Question, TestAttempt, UserAnswer
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from .models import (
    UserProfile,CustomUser,UserPerformance,Review,Category,StudentCapture,RecentActivity,AllowedParticipant,Answer,Option,Question, UserSettings,AdminSettings, ManageTests,UserResponse,
 ActivityLog,Performer,Enrollment,TestUser,TestResult,TestAttempt,Feature, LeaderboardEntry,
 Testimonial,Test, Announcement, FAQ, PasswordReset, ContactMessage,AdminNotification, Notification,AttemptedTest,Achievement,
PerformanceStat,CompletedTest, TestSummary,
)
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()
class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True)  # Accept role from frontend

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Hash the password before saving
        validated_data['password'] = make_password(validated_data['password'])

        # Create the user instance with all validated data (including role)
        user = CustomUser.objects.create(**validated_data)

        return user
class TestSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptedTest
        fields = ['test', 'score']
class ReviewAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['question', 'answer', 'is_correct']
class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser 
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_picture', 'phone', 'linkedin', 'status']

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['user', 'action', 'date', 'ip']
class ReviewSerializer(serializers.ModelSerializer):
    answers = ReviewAnswerSerializer(many=True, source='answers')

    class Meta:
        model = TestAttempt
        fields = ['id', 'test', 'answers']
class AttemptedTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttemptedTest
        fields = '__all__'
        
class PerformanceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPerformance
        fields = ['total_tests', 'total_score']
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = '__all__'
class TestResultSerializer(serializers.ModelSerializer):
    correct_answer = serializers.CharField(required=True)
    class Meta:
        model = TestResult
        fields = '__all__'

from .models import Feedback
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'
class LeaderboardEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaderboardEntry
        fields = '__all__'

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id','title', 'message', 'created_by']  # Add relevant fields

class NotificationSerializer(serializers.ModelSerializer):
    announcement = AnnouncementSerializer()  # Nest announcement details

    class Meta:
        model = Notification
        fields = ['id', 'is_read', 'created_at', 'announcement']
class UserSettingsSerializer(serializers.ModelSerializer):
   class Meta:
      model = UserSettings
      fields = ['dark_mode', 'test_access', 'integration', 'auto_save', 'time_reminder', 'notifications']

class UserProfileSerializer(serializers.ModelSerializer):
   username = serializers.CharField(source='user.username', read_only=True)
   class Meta:
      model = UserProfile
      fields = ['id', 'username', 'name', 'phone_number', 'address', 'profile_picture_url','bio',]

class CategorySerializer(serializers.ModelSerializer):
   class Meta:
      model = Category
      fields = '__all__'

class OptionSerializer(serializers.ModelSerializer):
   class Meta:
      model = Option
      fields = ["id", "option_text"]

class AdminSettingsSerializer(serializers.ModelSerializer):
 class Meta:
    model = AdminSettings
    fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
 class Meta:
    model = Review
    fields = ['question', 'answer', 'correct']

class ManageTestsSerializer(serializers.ModelSerializer):
   class Meta:
      model = ManageTests
      fields = '__all__'

class UserResponseSerializer(serializers.ModelSerializer):
   class Meta:
      model = UserResponse
      fields = '__all__'

class PerformerSerializer(serializers.ModelSerializer):
   class Meta:
      model = Performer
      fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
   class Meta:
      model = Review
      fields = ['question', 'answer', 'correct']
class FeatureSerializer(serializers.ModelSerializer):
 class Meta:
    model = Feature 
    fields = '__all__'

class TestimonialSerializer(serializers.ModelSerializer):
 class Meta:
    model = Testimonial
    fields = '__all__'


class FAQSerializer(serializers.ModelSerializer):
   class Meta:
      model = FAQ
      fields = '__all__'

class PasswordResetSerializer(serializers.ModelSerializer):
   class Meta:
      model = PasswordReset
      fields = '__all__'

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = "__all__"

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = "__all__"

class AchievementSerializer(serializers.ModelSerializer):
   class Meta:
      model = Achievement
      fields = '__all__'

class TopScorerSerializer(serializers.Serializer):
 studentId = serializers.IntegerField(source="student.id")
 averageScore = serializers.FloatField()

class ActivitySerializer(serializers.ModelSerializer):
   class Meta:
      model = ActivityLog
      fields = ['activity', 'timestamp']

class TestSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSummary
        fields = '__all__'

class CompletedTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompletedTest
        fields = "__all__"

class PerformanceStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceStat
        fields = '__all__'

class RecentActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = RecentActivity
        fields = fields = ['id', 'user', 'description', 'details', 'timestamp']
class AllowedParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedParticipant
        fields = ['test', 'email']
class TestUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestUser
        fields = ['id', 'name', 'email', 'created_at']
class UserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserResponse
        fields = ['test_name', 'question', 'correct', 'incorrect', 'attempts']
class QuestionSerializer(serializers.ModelSerializer):
    test = serializers.PrimaryKeyRelatedField(read_only=True)  # ✅ Prevents "test" field error
    options = serializers.JSONField(default=list)  # ✅ Prevents null options
    correct_answer = serializers.JSONField(default=list) 
    class Meta:
        model = Question
        fields = ["id", "text", "type", "options", "correct_answer", "test"]

from rest_framework import serializers
from .models import Test, Question

class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)  # ✅ Handle nested questions
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)

    class Meta:
        model = Test
        fields = "__all__"
        read_only_fields = ['total_marks', 'total_time_limit', 'total_questions']  # ✅ Auto-calculated

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        test = Test.objects.create(**validated_data)

        for question_data in questions_data:
            Question.objects.create(test=test, **question_data)

        # ✅ Auto-update test fields
        test.total_questions = test.questions.count()
        test.total_marks = test.total_questions * float(test.marks_per_question)
        test.total_time_limit = test.total_questions * float(test.time_limit_per_question)
        test.save()

        return test

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)

        # ✅ Update only if `questions` is provided
        if questions_data is not None:
            instance.questions.all().delete()  # Remove old questions
            for question_data in questions_data:
                Question.objects.create(test=instance, **question_data)

        instance.marks_per_question = validated_data.get('marks_per_question', instance.marks_per_question)
        instance.time_limit_per_question = validated_data.get('time_limit_per_question', instance.time_limit_per_question)

        # ✅ Auto-calculate updated values
        instance.total_questions = instance.questions.count()
        instance.total_marks = instance.total_questions * float(instance.marks_per_question)
        instance.total_time_limit = instance.total_questions * float(instance.time_limit_per_question)

        instance.save()
        return instance

class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.text", read_only=True)

    class Meta:
        model = UserAnswer
        fields = ['id', 'question_text', 'selected_option']


class StudentCaptureSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentCapture
        fields = '__all__'
        read_only_fields = ('timestamp', 'is_valid', 'validation_message')

class TestAttemptSerializer(serializers.ModelSerializer):
    test_name = serializers.CharField(source="test.title", read_only=True)
    subject = serializers.CharField(source="test.subject", read_only=True)
      
    answers = UserAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = TestAttempt
        fields = ["id", "test_name", "subject", "start_time", "end_time", "score", "status", "answers"]
        extra_kwargs = {
            'score': {'required': False},  
            'test': {'required': True}, 
        }
        
class BulkQuestionSerializer(serializers.Serializer):
     questions = QuestionSerializer(many=True)