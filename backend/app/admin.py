from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role, Test, TestQuestion, Question, TestAttempt, TestResult, ProctoringSession, ProctoringLog, Leaderboard, Achievement, Category, UserProfile, Notification, PasswordReset, AnalyticsReport, TestProctoringSetting, QuestionImportLog, UserActivityLog

# Register the custom User model with the built-in UserAdmin
admin.site.register(User, UserAdmin)
admin.site.register(Role)
admin.site.register(Test)
admin.site.register(TestQuestion)
admin.site.register(Question)
admin.site.register(TestAttempt)
admin.site.register(TestResult)
admin.site.register(ProctoringSession)
admin.site.register(ProctoringLog)
admin.site.register(Leaderboard)
admin.site.register(Achievement)
admin.site.register(Category)
admin.site.register(UserProfile)
admin.site.register(Notification)
admin.site.register(PasswordReset)
admin.site.register(AnalyticsReport)
admin.site.register(TestProctoringSetting)
admin.site.register(QuestionImportLog)
admin.site.register(UserActivityLog)


# Register your models here.
