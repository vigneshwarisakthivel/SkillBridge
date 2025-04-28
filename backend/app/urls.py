from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestViewSet, TestAttemptViewSet,submit_test,user_attempted_tests,user_test_stats,leaderboard,UserAnswerViewSet, QuestionViewSet
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from . import views
from django.conf.urls.static import static
from .views import (UploadQuestionsView,
    LoginView, RegisterView,RecentActivityDeleteView,get_csrf_token, get_test_questions,create_test, CategoryListCreateView, get_tests,
    CategoryRetrieveUpdateDestroyView, UserTestStatsAPIView, TestListCreateView, AvailableTestsView,
    RecentActivityListCreateView, QuestionCreateAPIView, TestDetailAPIView, ManageTestsViewSet,
    QuestionListCreateView, QuestionDetailAPIView, UserResponseListCreateView,complete_test,
    PerformanceHistoryView, UserProfileView, AttemptedTestViewSet, AdminSettingsViewSet,AnnouncementDetailView,
    PerformerListCreateView, PerformerRetrieveUpdateDestroyView, FeatureListCreateView,
    AnnouncementViewSet, get_user_info, FeatureRetrieveUpdateDestroyView, TestimonialListCreateView,
    TestimonialRetrieveUpdateDestroyView, FAQListCreateView, FAQRetrieveUpdateDestroyView,
    AchievementView,user_management_stats,request_otp,verify_otp,mark_notifications_as_read,duplicate_test,
    PasswordResetView, ContactMessageView,AdminNotificationViewSet, dashboard_view,test_management_view,
    NotificationViewSet, TestSummaryList,test_report,test_overview_view,test_completion_rate_view,
    UserSettingsView, CompletedTestCreateView, dashboards_overview, analytics_report,CompletedTestViewSet,
    user_management_overview,UserProfileViewSet, enroll_student,save_consent, FeedbackViewSet, AchievementsView,
    AchievementRetrieveUpdateDestroyView,PerformanceStatListCreateView, ReviewAPIView, ExportAPIView
)

router = DefaultRouter()
admin_notification_list = AdminNotificationViewSet.as_view({'get': 'list'})
router.register(r'manage-tests', ManageTestsViewSet)
router.register(r'tests', TestViewSet)
router.register(r'attempted-tests', AttemptedTestViewSet, basename='attempted-test')
router.register(r'answers', UserAnswerViewSet)
router.register(r"completed-tests", CompletedTestViewSet, basename="completed-tests")
router.register(r'questions', QuestionViewSet)
router.register(r'users', UserProfileViewSet, basename='user')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'attempts', TestAttemptViewSet, basename='testattempt') 
test_attempt_viewset = TestAttemptViewSet.as_view({
    'get': 'get_user_statistics', 
    'get': 'get_user_rank', # Maps GET requests to get_user_statistics
})
urlpatterns = [
    path('decode-test-uuid/<str:uuid_str>/', views.decode_uuid_and_get_test_id),
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
    path("notifications/mark-as-read/", mark_notifications_as_read, name="mark-notifications-as-read"),
    path('forgot-password/request-otp/', request_otp, name="request_otp"),
    path('forgot-password/verify-otp/', verify_otp, name="verify_otp"),
    path('user-management-stats/', user_management_stats, name='user-management-stats'),
    path('achievements/', AchievementView.as_view(), name='achievements'),
    path('admin-notifications/', admin_notification_list, name='admin-notifications'),
    path("test-report/<int:test_id>/",test_report, name="test-report"),
    path('userss/<int:pk>/', UserProfileViewSet.as_view({'get': 'retrieve'}), name='user-profile'),
    path('tests/<str:test_id>/save_consent/', save_consent, name='save_consent'),
    path('feedbacks/', FeedbackViewSet.as_view({'get': 'list', 'post': 'create'}), name='feedback-list'),
    path('analytics/', analytics_report, name='analytics-report'),
    path('dashboard/', dashboards_overview, name='dashboard-overview'),
    path('user-managements/', user_management_overview, name='user-management'),
    path('enroll/', enroll_student, name='enroll-student'),
    path('test-users/', views.register_test_user, name='register_test_user'),
    path('tests/<int:pk>/review/', ReviewAPIView.as_view(), name='test-review'),
    path('tests/<int:pk>/export/', ExportAPIView.as_view(), name='test-export'),
    path('dashboard-overview/', dashboard_view, name='dashboard-overview'),
    path('tests-data/', test_overview_view, name='get-tests-data'),
    path('test/', get_tests, name='get-tests'),
    path('tests/public/', views.public_tests, name='public-tests'),
    path('tests/<int:test_id>/questions/', views.get_questions_from_test, name='get-questions-from-test'),
    path('tests/import-questions/', views.import_questions, name='import-questions'),
    path('userss/', get_user_info, name='get-user-info'),
    path('available-tests/', AvailableTestsView.as_view(), name='available-tests'),
    path('performance-history/', PerformanceHistoryView.as_view(), name='performance-history'),
    path('user-settings/', UserSettingsView.as_view(), name='user-settings'),
    path('user-settings/reset/', UserSettingsView.as_view(), name='user-settings-reset'),
    path('assessments/online-exams/<str:long_test_id>/get-questions/', get_test_questions, name='get-test-questions'),
    path('user-data/', UserProfileView.as_view(), name='user-data'),
    path('completed-testss/', CompletedTestCreateView.as_view(), name='completed-tests'),
    path('performance-stats/', PerformanceStatListCreateView.as_view(), name='performance-stats'),
    path('recent-activities/', RecentActivityListCreateView.as_view(), name='recent-activities'),
    path('get-secure-uuid/<int:testid>/', views.get_secure_uuid),
    path('test-attempts/<int:pk>/export_certificate/', 
         TestAttemptViewSet.as_view({'get': 'export_certificate'}), 
         name='export_certificate'),
    path('recent-activities/<int:pk>/', RecentActivityDeleteView.as_view(), name='delete-recent-activity'),
    path('test/create/', create_test, name='create-test'),
    path('login/', LoginView.as_view(), name='login'),
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryRetrieveUpdateDestroyView.as_view(), name='category-detail'),
    path('test/', TestListCreateView.as_view(), name='test-list-create'),
    path('upload-allowed-emails/', views.upload_allowed_emails, name='upload_allowed_emails'),
    path('tests/<int:pk>/', TestDetailAPIView.as_view(), name='test-detail'),
    path('question/', QuestionListCreateView.as_view(), name='question-list-create'),
    path('question/<int:pk>/', QuestionDetailAPIView.as_view(), name='question-detail'),
    path('test-summary/', TestSummaryList.as_view(), name='test-summary'),
    path('test-attempts/<int:pk>/review/', TestAttemptViewSet.as_view({'get': 'review'}), name='test-attempt-review'),
    path('user-responses/', UserResponseListCreateView.as_view(), name='user-responses'),
    path('user-profile/', UserProfileView.as_view(), name='user-profile'),
    path('admin-settings/', AdminSettingsViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-settings'),
    path('performers/', PerformerListCreateView.as_view(), name='performer-list-create'),
    path('performers/<int:pk>/', PerformerRetrieveUpdateDestroyView.as_view(), name='performer-detail'),
    path('features/', FeatureListCreateView.as_view(), name='feature-list-create'),
    path('features/<int:pk>/', FeatureRetrieveUpdateDestroyView.as_view(), name='feature-detail'),
    path('testimonials/', TestimonialListCreateView.as_view(), name='testimonial-list-create'),
    path('testimonials/<int:pk>/', TestimonialRetrieveUpdateDestroyView.as_view(), name='testimonial-detail'),
    path('faqs/', FAQListCreateView.as_view(), name='faq-list-create'),
    path('faqs/<int:pk>/', FAQRetrieveUpdateDestroyView.as_view(), name='faq-detail'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path("contact-submissions/", ContactMessageView.as_view(), name="contact-message"),
    path('admin-notifications/mark-read/', AdminNotificationViewSet.as_view({'post': 'mark_as_read'})),
    path('achievement/', AchievementsView.as_view(), name='achievement-list-create'),
    path('achievement/<int:pk>/', AchievementRetrieveUpdateDestroyView.as_view(), name='achievement-detail'),
    path('test-completion-rates/', test_completion_rate_view, name='test_completion_rates'),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('user/test-stats/', UserTestStatsAPIView.as_view(), name='user-test-stats'),
    path('submit-test/', submit_test, name="submit-test"),
    path('user/test-stats/', user_test_stats, name="user-test-stats"),
    path('test/', user_attempted_tests, name="user-attempted-tests"),
    path('leaderboard/', leaderboard, name="leaderboard"),
    path("tests/<int:test_id>/duplicate/", duplicate_test, name="duplicate_test"),
    path("csrf/", get_csrf_token),
    path('complete-test/<int:test_attempt_id>/', complete_test, name='complete_test'),
    path('tests-management/', test_management_view, name='test_management'),
    path("test-attempts/statistics/", TestAttemptViewSet.as_view({"get": "get_user_statistics"}), name="user-statistics"),
    path("test-attempts/rank/<int:test_id>/", TestAttemptViewSet.as_view({"get": "get_user_rank"}), name="user-rank"),
    path('questions/upload/', UploadQuestionsView.as_view(), name='upload-questions'),
    path('', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)