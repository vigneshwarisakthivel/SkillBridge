from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter



# Initialize the Default Router for ViewSets
router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'tests', TestViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'testquestions', TestQuestionViewSet)
router.register(r'testattemps', TestAttemptViewSet)
router.register(r'testresults', TestResultViewSet)
router.register(r'proctoringsessions', ProctoringSessionViewSet)
router.register(r'proctoringlogs', ProctoringLogViewSet)
router.register(r'leaderboards', LeaderboardViewSet)
router.register(r'achievements', AchievementViewSet)
router.register(r'userprofiles', UserProfileViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'passwordresets', PasswordResetViewSet)
router.register(r'analyticsreports', AnalyticsReportViewSet)
router.register(r'testproctoringsettings', TestProctoringSettingViewSet)
router.register(r'questionimportlogs', QuestionImportLogViewSet)
router.register(r'useractivitylogs', UserActivityLogViewSet)

# Define the URL patterns
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/detail/', UserDetailView.as_view(), name='user_detail'),
    # Include the router-generated URL patterns for ViewSets
    path('api/', include(router.urls)),
]
