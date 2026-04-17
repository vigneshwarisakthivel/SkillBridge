from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()

urlpatterns = [
    path('register/', register),
    path('login/', login),
    path('profile/', get_profile),
    path('profile/upload/', upload_profile),
    path('notifications/<int:id>/read/', mark_notification_read),
    path('notifications/read-all/', mark_all_notifications_read),
    path('notifications/', get_notifications),
    path('notifications/<int:id>/delete/', delete_notification),

    path('logout/', logout),
      path("me/", MeView.as_view(),        name="me"),
 
    # ── Tests ─────────────────────────────────────────────────────────────────
    path("tests/", TestListCreateView.as_view(),  name="test-list-create"),
    path("tests/<int:pk>/", TestDetailView.as_view(),      name="test-detail"),
    path("tests/<int:pk>/status/", TestStatusView.as_view(),      name="test-status"),
    path("tests/public/<str:encoded_uuid>/", PublicTestView.as_view(),          name="test-public"),
    path("tests/<int:pk>/edit/", EditTestView.as_view(), name="edit-test"),
    # ── Secure UUID (for share links) ─────────────────────────────────────────
    path("get-secure-uuid/<int:test_id>/",GetSecureUUIDView.as_view(), name="get-secure-uuid"),
    # Question bank (standalone — no test attached)  ← NEW
    path("questions/bank/",                     BulkBankQuestionCreateView.as_view(),  name="bank-questions"),  # POST (bulk create) + GET
    path("questions/bank/<int:pk>/",            BankQuestionDetailView.as_view(),       name="bank-question-detail"),
    path("question/bank/",        BankQuestionListView.as_view(),   name="bank-question-list"),

    # ── Questions ─────────────────────────────────────────────────────────────
    path("questions/",                          QuestionListView.as_view(),           name="question-list"),
    path("questions/<int:pk>/",                QuestionDetailView.as_view(),         name="question-detail"),
    path("questions/upload/", QuestionUploadView.as_view(),         name="question-upload"),
    path("tests/<int:test_id>/questions/", TestQuestionListCreateView.as_view(), name="test-questions"),
    path('test-login/', test_login, name='test-login'),
    # ── Invitations ───────────────────────────────────────────────────────────
    path("upload-allowed-emails/",  UploadAllowedEmailsView.as_view(),    name="upload-allowed-emails"),
    path("tests/<int:test_id>/allowed-emails/", AllowedEmailListView.as_view(),       name="allowed-emails"),
        # Candidates
    path("candidates/",         CandidateListCreateView.as_view(), name="candidate-list-create"),
    path("candidates/<int:pk>/", CandidateDetailView.as_view(),    name="candidate-detail"),
    path('assignments/<int:assignment_id>/send-selection/', send_selection_mail),
    # Assignments
    path("assignments/",                      AssignmentListView.as_view(),   name="assignment-list"),
    path("assignments/bulk/",                        BulkAssignView.as_view(),       name="assignment-bulk"),
    path("assignments/remind/",                        SendReminderView.as_view(),      name="assignment-remind"),
    path("assignments/<int:pk>/",                 AssignmentDetailView.as_view(), name="assignment-detail"),
    path("assignments/<int:assignment_id>/reminders/",    ReminderLogListView.as_view(),  name="reminder-log"),
    # Activity log
    path("activity/",          ActivityLogListView.as_view(),       name="activity-list"),
    path("activity/clear/", ActivityLogClearView.as_view(),      name="activity-clear"),
    path("activity/bulk-delete/",ActivityLogBulkDeleteView.as_view(), name="activity-bulk-delete"),
    path("activity/<int:pk>/",   ActivityLogDeleteView.as_view(),     name="activity-delete"),
    path("dashboard/",DashboardView.as_view(), name="dashboard"),
    # Password reset
    path("password-reset/send-otp/", SendOTPView.as_view(),    name="send-otp"),
    path("password-reset/verify-otp/",VerifyOTPView.as_view(), name="verify-otp"),
    path("password-reset/reset/",   ResetPasswordView.as_view(), name="reset-password"),
    path("log-malpractice/",    LogMalpracticeView.as_view(),     name="log-malpractice"),
    path("submit-test/",    SubmitTestView.as_view(),          name="submit-test"),
    path("tests/<int:test_id>/malpractice/",MalpracticeLogListView.as_view(), name="malpractice-log"),
    path('', include(router.urls)),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)