from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Role, Category, Test, Question, TestQuestion, TestAttempt, TestResult,
    ProctoringSession, ProctoringLog, Leaderboard, Achievement, UserProfile,
    Notification, PasswordReset, AnalyticsReport, TestProctoringSetting,
    QuestionImportLog, UserActivityLog
)

# Role Serializer
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

# User Serializer (with password management and JWT token handling)
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'confirm_password']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

# Minimal User Serializer for basic information
class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

# Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

# Minimal Category Serializer
class CategoryMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

# Test Serializer
class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = '__all__'

# Question Serializer
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

# TestQuestion Serializer
class TestQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestQuestion
        fields = '__all__'

# TestAttempt Serializer
class TestAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAttempt
        fields = '__all__'

# TestResult Serializer
class TestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestResult
        fields = '__all__'

# ProctoringSession Serializer
class ProctoringSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProctoringSession
        fields = '__all__'

# ProctoringLog Serializer
class ProctoringLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProctoringLog
        fields = '__all__'

# Leaderboard Serializer
class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leaderboard
        fields = '__all__'

# Achievement Serializer
class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'

# UserProfile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

# Notification Serializer
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

# PasswordReset Serializer
class PasswordResetSerializer(serializers.ModelSerializer):
    class Meta:
        model = PasswordReset
        fields = '__all__'

# AnalyticsReport Serializer
class AnalyticsReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsReport
        fields = '__all__'

# TestProctoringSetting Serializer
class TestProctoringSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestProctoringSetting
        fields = '__all__'

# QuestionImportLog Serializer
class QuestionImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionImportLog
        fields = '__all__'

# UserActivityLog Serializer
class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityLog
        fields = '__all__'
