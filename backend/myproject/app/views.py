from rest_framework.decorators import api_view, permission_classes,authentication_classes
from rest_framework.response import Response
from rest_framework import status, generics, filters
from .serializers import *
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import *
from django.db import transaction
import csv
from django.shortcuts import get_object_or_404
import io
import os
import json
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views import View
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "User created successfully"},
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 🔐 LOGIN
@api_view(['POST'])
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    user = authenticate(username=email, password=password)

    if user is not None:
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })
    else:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )


# ✅ Upload profile image
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile(request):
    profile = Profile.objects.get(user=request.user)
    profile.image = request.FILES.get('image')
    profile.save()

    return Response({
        "message": "Profile updated",
        "image": profile.image.url
    })


# ✅ Get profile
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    profile = Profile.objects.get(user=request.user)
    serializer = ProfileSerializer(profile, context={"request": request})
    return Response(serializer.data)


# ✅ Get notifications
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


# ✅ Mark as read / delete
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, id):
    notif = Notification.objects.get(id=id, user=request.user)
    notif.delete()
    return Response({"message": "Deleted"})

# ✅ Mark single notification as read
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, id):
    try:
        notif = Notification.objects.get(id=id, user=request.user)
        notif.is_read = True
        notif.save()
        return Response({"message": "Marked as read"})
    except Notification.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

# ✅ Mark all notifications as read
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"message": "All marked as read"})

@api_view(['POST'])
def logout(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({"message": "Logged out"})
    except Exception:
        return Response({"error": "Invalid token"}, status=400)
    

class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestListCreateView(generics.ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "subject", "category"]
    ordering_fields = ["created_at", "title", "rank"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Test.objects.filter(owner=self.request.user)
        status_filter = self.request.query_params.get("status")
        difficulty_filter = self.request.query_params.get("difficulty")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if difficulty_filter:
            qs = qs.filter(difficulty=difficulty_filter)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TestDetailSerializer
        return TestListSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TestDetailView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TestDetailSerializer

    def get_queryset(self):
        return Test.objects.filter(owner=self.request.user)


class TestStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            test = Test.objects.get(pk=pk, owner=request.user)
        except Test.DoesNotExist:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get("status")
        if new_status not in dict(Test.STATUS_CHOICES):
            return Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        test.status = new_status
        test.save(update_fields=["status"])
        return Response({"id": test.id, "status": test.status})


class GetSecureUUIDView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        try:
            test = Test.objects.get(pk=test_id, owner=request.user)
        except Test.DoesNotExist:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"encoded_uuid": test.secure_uuid})

class QuestionListView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionBankSerializer

    def get_queryset(self):
        return Question.objects.filter(
            owner=self.request.user,
            test__isnull=True,
        ).order_by("-created_at")   # 🔥 ADD THIS

class PublicTestView(APIView):
    """GET /api/tests/public/<encoded_uuid>/ → fetch a public test by encoded UUID (no auth)"""
    permission_classes = [AllowAny]
 
    def get(self, request, encoded_uuid):
        try:
            test = Test.objects.get(secure_uuid=encoded_uuid, status="published")
        except Test.DoesNotExist:
            return Response({"error": "Test not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(TestDetailSerializer(test).data)
 
class TestQuestionListCreateView(generics.ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionBankSerializer

    def get_queryset(self):
        return Question.objects.filter(
            test_id=self.kwargs["test_id"],
            test__owner=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(test_id=self.kwargs["test_id"])


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionBankSerializer

    def get_queryset(self):
        return Question.objects.filter(test__owner=self.request.user)


class QuestionUploadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        test_id = request.data.get("test_id")
        if not file or not test_id:
            return Response(
                {"error": "Both 'file' and 'test_id' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            test = Test.objects.get(pk=test_id, owner=request.user)
        except Test.DoesNotExist:
            return Response({"error": "Test not found."}, status=status.HTTP_404_NOT_FOUND)

        created = []
        if file.name.lower().endswith(".csv"):
            decoded = file.read().decode("utf-8")
            reader = csv.DictReader(io.StringIO(decoded))
            for row in reader:
                text = row.get("text", "").strip()
                q_type = row.get("type", "multiplechoice").strip()
                options = [
                    row.get(f"option{i}", "").strip()
                    for i in range(1, 5)
                    if row.get(f"option{i}", "").strip()
                ]
                correct_answer = row.get("correct_answer", "").strip()
                if text:
                    q = Question.objects.create(
                        test=test, text=text, type=q_type,
                        options=options, correct_answer=correct_answer,
                    )
                    created.append(q.id)
        else:
            return Response(
                {"error": "Unsupported file type. Please upload a CSV."},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )
        return Response({"created": len(created), "question_ids": created}, status=status.HTTP_201_CREATED)


# 🔐 Generate Passcode
def generate_passcode():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

class UploadAllowedEmailsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UploadAllowedEmailsSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        test_id = serializer.validated_data["test_id"]
        emails  = serializer.validated_data["emails"]

        try:
            test = Test.objects.get(pk=test_id, owner=request.user)
        except Test.DoesNotExist:
            return Response({"error": "Test not found."}, status=status.HTTP_404_NOT_FOUND)

        added  = []
        failed = []

        test_link = f"http://localhost:3000/test/{test.secure_uuid}"

        for email in emails:
            passcode = generate_passcode()

            # ── Create or get Candidate ───────────────────
            candidate, _ = Candidate.objects.get_or_create(
                owner=request.user,
                email=email,
                defaults={
                    "name": email.split("@")[0]  # use part before @ as default name
                }
            )

            # ── Create or get AllowedEmail ────────────────
            obj, created = AllowedEmail.objects.get_or_create(
                test=test,
                email=email,
                defaults={"passcode": passcode}
            )

            # ── Create or get Assignment ──────────────────
            TestAssignment.objects.get_or_create(
                candidate=candidate,
                test=test,
                defaults={"status": "not_started"}
            )

            if created:
                added.append(email)
                try:
                    send_mail(
                        subject=f"You're Invited to Take: {test.title}",
                        message=(
                            f"Dear {candidate.name},\n\n"
                            f"You have been selected to complete an assessment through Skill Bridge.\n"
                            f"Please find your test details below.\n\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"  ASSESSMENT DETAILS\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"  Test Title  : {test.title}\n"
                            f"  Subject     : {test.subject or 'N/A'}\n"
                            f"  Difficulty  : {test.difficulty.capitalize() if test.difficulty else 'N/A'}\n"
                            f"  Duration    : {test.total_time_limit} minutes\n"
                            f"  Access Link : {test_link}\n\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"  YOUR CREDENTIALS\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"  Email       : {email}\n"
                            f"  Passcode    : {passcode}\n\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                            f"INSTRUCTIONS\n"
                            f"  • Click the access link above to begin your assessment.\n"
                            f"  • Enter your email address and passcode when prompted.\n"
                            f"  • Ensure you have a stable internet connection before starting.\n"
                            f"  • Do not share your passcode with anyone.\n"
                            f"  • Once started, complete the test in one sitting.\n\n"
                            f"If you have any questions or encounter any issues,\n"
                            f"please contact your administrator immediately.\n\n"
                            f"We wish you the very best.\n\n"
                            f"Warm regards,\n"
                            f"The Skill Bridge Team\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"This is an automated message. Please do not reply to this email."
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                    )
                except Exception as e:
                    failed.append({"email": email, "error": str(e)})
            else:
                failed.append({"email": email, "error": "Already invited"})

        return Response({
            "added":          len(added),
            "success_emails": added,
            "failed":         failed,
            "test_link":      test_link,
        }, status=status.HTTP_201_CREATED)
    
@api_view(['POST'])
def test_login(request):
    name = request.data.get("name")
    email = request.data.get("email")
    passcode = request.data.get("passcode")
    test_uuid = request.data.get("test_uuid")

    try:
        test = Test.objects.get(secure_uuid=test_uuid)

        # ✅ Validate allowed email
        allowed = AllowedEmail.objects.get(
            test=test,
            email=email,
            passcode=passcode
        )

        # 🚫 Block if already used
        if allowed.is_used:
            return Response(
                {"error": "You have already attended this test."},
                status=403
            )

        # ✅ STORE NAME HERE
        candidate, created = Candidate.objects.get_or_create(
            owner=test.owner,
            email=email,
            defaults={"name": name}
        )

        # ✅ Update name if needed
        if name and candidate.name != name:
            candidate.name = name
            candidate.save(update_fields=["name"])

        # ✅ Mark as used
        allowed.is_used = True
        allowed.save(update_fields=["is_used"])

        return Response({
            "access": True,
            "name": candidate.name,
            "email": candidate.email
        })

    except AllowedEmail.DoesNotExist:
        return Response(
            {"error": "Invalid credentials"},
            status=400
        )

class AllowedEmailListView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = AllowedEmailSerializer

    def get_queryset(self):
        return AllowedEmail.objects.filter(
            test_id=self.kwargs["test_id"],
            test__owner=self.request.user,
        )
    
class BankQuestionListView(generics.ListAPIView):
    """
    GET /api/questions/bank/
    Returns only standalone bank questions (no test attached)
    belonging to the current user.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionBankSerializer

    def get_queryset(self):
        return Question.objects.filter(
            owner=self.request.user,
            test__isnull=True,
        )


class BulkBankQuestionCreateView(APIView):
    """
    POST /api/questions/bank/
    Body: { "questions": [ { text, type, options, correct_answer }, ... ] }
    Saves all questions to the bank in one request — matches QuestionCreator's handleSave.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BulkQuestionBankSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        questions_data = serializer.validated_data["questions"]
        created = []
        for q_data in questions_data:
            q = Question.objects.create(
                owner=request.user,
                test=None,          # standalone — not attached to any test
                text=q_data["text"],
                type=q_data["type"],
                options=q_data.get("options", []),
                correct_answer=q_data.get("correct_answer"),
            )
            created.append(q.id)

        return Response(
            {
                "saved": len(created),
                "question_ids": created,
                "message": f"{len(created)} question{'s' if len(created) != 1 else ''} saved to bank.",
            },
            status=status.HTTP_201_CREATED,
        )


    
# ─────────────────────────────────────────────────────────────────────────────
# CANDIDATES
# ─────────────────────────────────────────────────────────────────────────────

class CandidateListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/candidates/   → list all candidates belonging to the current admin
    POST /api/candidates/   → add a new candidate
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = CandidateSerializer
    filter_backends        = [filters.SearchFilter]
    search_fields          = ["name", "email"]

    def get_queryset(self):
        return Candidate.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CandidateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/candidates/<id>/"""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = CandidateSerializer

    def get_queryset(self):
        return Candidate.objects.filter(owner=self.request.user)


# ─────────────────────────────────────────────────────────────────────────────
# ASSIGNMENTS  (the rows in UserManagement table)
# ─────────────────────────────────────────────────────────────────────────────

class AssignmentListView(generics.ListAPIView):
    """
    GET /api/assignments/
    Returns all assignments for tests owned by the current user.
    Supports ?status=completed|not_completed and ?search=name_or_email
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = TestAssignmentSerializer

    def get_queryset(self):
        qs = TestAssignment.objects.filter(
            test__owner=self.request.user
        ).select_related("candidate", "test")

        status_filter = self.request.query_params.get("status")
        search        = self.request.query_params.get("search", "").lower()

        if status_filter == "completed":
            qs = qs.filter(status="completed")
        elif status_filter == "not_completed":
            qs = qs.exclude(status="completed")

        if search:
            qs = qs.filter(
                models.Q(candidate__name__icontains=search) |
                models.Q(candidate__email__icontains=search)
            )

        return qs


class AssignmentDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/assignments/<id>/  → fetch single assignment
    PATCH /api/assignments/<id>/  → update status or score (e.g. when student submits)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = TestAssignmentSerializer

    def get_queryset(self):
        return TestAssignment.objects.filter(test__owner=self.request.user)

    def perform_update(self, serializer):
        data = serializer.validated_data
        # Auto-set completed_at when status flips to completed
        if data.get("status") == "completed" and not serializer.instance.completed_at:
            serializer.save(completed_at=timezone.now())
        else:
            serializer.save()


class BulkAssignView(APIView):
    """
    POST /api/assignments/bulk/
    Body: { test_id, candidate_ids: [1, 2, 3] }
    Assigns one test to multiple candidates in one call.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        serializer = BulkAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        test_id       = serializer.validated_data["test_id"]
        candidate_ids = serializer.validated_data["candidate_ids"]

        try:
            test = Test.objects.get(pk=test_id, owner=request.user)
        except Test.DoesNotExist:
            return Response({"error": "Test not found."}, status=status.HTTP_404_NOT_FOUND)

        created = []
        skipped = []
        for cid in candidate_ids:
            try:
                candidate = Candidate.objects.get(pk=cid, owner=request.user)
                obj, was_created = TestAssignment.objects.get_or_create(
                    candidate=candidate, test=test
                )
                if was_created:
                    created.append(cid)
                else:
                    skipped.append(cid)
            except Candidate.DoesNotExist:
                skipped.append(cid)

        return Response(
            {"assigned": len(created), "skipped": len(skipped),
             "created_ids": created, "skipped_ids": skipped},
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# REMINDERS
# ─────────────────────────────────────────────────────────────────────────────

class SendReminderView(APIView):
    """
    POST /api/assignments/remind/
    Body: { assignment_id, message }
    Logs the reminder and optionally sends an email.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        serializer = SendReminderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        assignment_id = serializer.validated_data["assignment_id"]
        message       = serializer.validated_data["message"]

        try:
            assignment = TestAssignment.objects.get(
                pk=assignment_id,
                test__owner=request.user
            )
        except TestAssignment.DoesNotExist:
            return Response({"error": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        # Log the reminder
        log = ReminderLog.objects.create(
            assignment=assignment,
            sent_by=request.user,
            message=message,
        )

        # Send actual email if EMAIL_BACKEND is configured
        try:
                    custom_message = message.strip()

                    email_body = custom_message if custom_message else (
                        f"Dear {assignment.candidate.name},\n\n"
                        f"This is a gentle reminder that your assessment\n"
                        f"on Skill Bridge is still pending completion.\n\n"
                        f"Test: {assignment.test.title}\n\n"
                        f"Please complete it at your earliest convenience.\n\n"
                        f"Regards,\nSkill Bridge Team"
                    )

                    send_mail(
                        subject=f"Reminder: Complete Your Assessment — {assignment.test.title}",
                        message=email_body,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[assignment.candidate.email],
                        fail_silently=True,
                    )
        except Exception as e:
            # Email failed but we still logged it — return success with a warning
            return Response({
                "sent": True,
                "logged": True,
                "email_sent": False,
                "warning": str(e),
                "reminder_id": log.id,
            })

        return Response({
            "sent": True,
            "logged": True,
            "email_sent": True,
            "reminder_id": log.id,
        }, status=status.HTTP_201_CREATED)


class ReminderLogListView(generics.ListAPIView):
    """GET /api/assignments/<assignment_id>/reminders/ → reminder history"""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = ReminderLogSerializer

    def get_queryset(self):
        return ReminderLog.objects.filter(
            assignment_id=self.kwargs["assignment_id"],
            assignment__test__owner=self.request.user,
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_selection_mail(request, assignment_id):
    try:
        assignment = TestAssignment.objects.select_related(
            "candidate", "test"
        ).get(id=assignment_id, test__owner=request.user)
    except TestAssignment.DoesNotExist:
        return Response({"error": "Assignment not found."}, status=404)

    candidate      = assignment.candidate
    test           = assignment.test
    custom_message = request.data.get("message", "").strip()

    try:
        send_mail(
            subject=f"Congratulations! You've Been Selected — {test.title}",
            message = custom_message.strip() if custom_message else (
                f"Dear {candidate.name},\n\n"
                f"We are thrilled to inform you that you have passed...\n\n"
                f"Regards,\nSkill Bridge Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate.email],
            fail_silently=False,
        )

        # ── Activity log ──────────────────────────────
        ActivityLog.objects.create(
            owner=request.user,
            type="selection",
            text=f"{candidate.name} was sent a selection email for '{test.title}'",
            detail=f"Score: {assignment.score}%",
        )

        # ── Notification ──────────────────────────────
        Notification.objects.create(
            user=request.user,
            text=f"Selection email sent to {candidate.name} for '{test.title}' ({assignment.score}%)",
            type="selection",
            is_read=False,
        )
        assignment.selection_sent = True
        assignment.save(update_fields=["selection_sent"])
        return Response({
            "sent":      True,
            "candidate": candidate.name,
            "email":     candidate.email,
            "score":     assignment.score,
            "selection_sent": True,
        })

    except Exception as e:
        return Response({"sent": False, "error": str(e)}, status=500)

class BankQuestionListView(APIView):
    """
    GET  /api/questions/bank/   → list all bank questions
    """
    def get(self, request):
        questions = Question.objects.all().order_by("-created_at")
        serializer = QuestionBankSerializer(questions, many=True)
        return Response(serializer.data)
        
class BankQuestionDetailView(APIView):
    """
    PATCH  /api/questions/bank/<id>/   → update question
    DELETE /api/questions/bank/<id>/   → delete question
    """
    def patch(self, request, pk):
        q = get_object_or_404(Question, pk=pk)
        serializer = QuestionBankSerializer(q, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    def delete(self, request, pk):
        q = get_object_or_404(Question, pk=pk)
        q.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
 

class EditTestView(APIView):
    """
    GET  /api/tests/<id>/edit/   → return full test + all its questions
    PATCH /api/tests/<id>/edit/  → update test fields + sync questions
    """
    permission_classes = [IsAuthenticated]
 
    # ── GET ─────────────────────────────────────────────────────────────────
    def get(self, request, pk):
        test = get_object_or_404(Test, pk=pk)
        serializer = TestSerializer(test)
        data = serializer.data
 
        # Attach full question list
        questions = Question.objects.filter(test=test).order_by("id")
        data["questions"] = QuestionSerializer(questions, many=True).data
 
        return Response(data, status=status.HTTP_200_OK)
 
    # ── PATCH ────────────────────────────────────────────────────────────────
    @transaction.atomic
    def patch(self, request, pk):
        test = get_object_or_404(Test, pk=pk)
 
        # ── 1. Update scalar test fields ────────────────────────────────────
        ALLOWED_FIELDS = [
            "title", "description", "category", "subject", "difficulty",
            "time_limit_per_question", "total_time_limit",
            "marks_per_question", "max_score", "total_marks",
            "pass_criteria", "instructions", "conclusion",
            "is_public", "allow_retakes", "number_of_retakes",
            "randomize_order", "allow_blank_answers",
            "penalize_incorrect_answers", "allow_jump_around",
            "only_move_forward", "disable_right_click", "disable_copy_paste",
            "disable_translate", "disable_autocomplete", "disable_spellcheck",
            "disable_printing", "receive_email_notifications",
            "notification_emails", "start_date", "end_date", "due_time",
            "status",
        ]
 
        for field in ALLOWED_FIELDS:
            if field in request.data:
                setattr(test, field, request.data[field])
 
        test.save()
 
        # ── 2. Sync questions (full replace strategy) ────────────────────────
        # Frontend sends the complete desired question list.
        # We delete all existing questions and recreate them so order is clean.
        if "questions" in request.data:
            incoming = request.data["questions"]
 
            if not isinstance(incoming, list):
                return Response(
                    {"error": "questions must be a list"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
 
            # Delete old questions for this test
            Question.objects.filter(test=test).delete()
 
            # Recreate
            created = []
            for idx, q_data in enumerate(incoming):
                q_type        = q_data.get("type", "multiplechoice")
                text          = q_data.get("text", "").strip()
                options       = q_data.get("options", [])
                correct_answer = q_data.get("correct_answer", None)
 
                if not text:
                    continue  # skip blank questions silently
 
                q = Question.objects.create(
                    test=test,
                    type=q_type,
                    text=text,
                    options=options,             # JSONField / ArrayField
                    correct_answer=correct_answer,  # JSONField handles all types
                    order=idx,
                )
                created.append(q)
 
            # Return updated test + fresh questions
            serializer = TestSerializer(test)
            data = serializer.data
            data["questions"] = QuestionSerializer(created, many=True).data
            return Response(data, status=status.HTTP_200_OK)
 
        # No questions payload — just return updated test
        serializer = TestSerializer(test)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# ─────────────────────────────────────────────────────────────────────────────
# ACTIVITY LOG
# ─────────────────────────────────────────────────────────────────────────────

class ActivityLogListView(generics.ListAPIView):
    """
    GET /api/activity/
    Returns activity log for the current user's tests/data.
    Supports ?type=attempt|score|user|test|question and ?search=text
    Also supports ?limit=N to match frontend's visibleCount pattern.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = ActivityLogSerializer

    def get_queryset(self):
        qs = ActivityLog.objects.filter(owner=self.request.user)

        type_filter = self.request.query_params.get("type")
        search      = self.request.query_params.get("search", "")
        limit       = self.request.query_params.get("limit")

        if type_filter and type_filter != "all":
            qs = qs.filter(type=type_filter)
        if search:
            qs = qs.filter(text__icontains=search)
        if limit:
            try:
                qs = qs[:int(limit)]
            except (ValueError, TypeError):
                pass

        return qs


class ActivityLogDeleteView(generics.DestroyAPIView):
    """DELETE /api/activity/<id>/ → delete a single log entry"""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get_queryset(self):
        return ActivityLog.objects.filter(owner=self.request.user)


class ActivityLogBulkDeleteView(APIView):
    """
    POST /api/activity/bulk-delete/
    Body: { ids: [1, 2, 3] }
    Deletes multiple log entries at once.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"error": "No IDs provided."}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = ActivityLog.objects.filter(
            pk__in=ids, owner=request.user
        ).delete()
        return Response({"deleted": deleted})


class ActivityLogClearView(APIView):
    """DELETE /api/activity/clear/ → wipe the entire log for this user"""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def delete(self, request):
        deleted, _ = ActivityLog.objects.filter(owner=request.user).delete()
        return Response({"deleted": deleted})

class DashboardView(APIView):
    """
    GET /api/dashboard/
    Returns stats, recent users (candidates), recent tests,
    and recent activity — all in one call.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request):
        user  = request.user
        now   = timezone.now()
        today = now.date()
        week_ago      = now - timedelta(days=7)
        yesterday     = now - timedelta(days=1)

        # ── Stats ────────────────────────────────────────────────────────────
        total_candidates = Candidate.objects.filter(owner=user).count()
        new_this_week    = Candidate.objects.filter(owner=user, created_at__gte=week_ago).count()

        all_tests        = Test.objects.filter(owner=user)
        active_tests     = all_tests.filter(status="published").count()
        new_tests_since_yesterday = all_tests.filter(created_at__gte=yesterday).count()

        total_assignments  = TestAssignment.objects.filter(test__owner=user).count()
        new_today          = TestAssignment.objects.filter(
            test__owner=user, assigned_date=today
        ).count()

        total_questions    = Question.objects.filter(
            Q(test__owner=user) | Q(owner=user)
        ).count()
        new_questions_week = Question.objects.filter(
            Q(test__owner=user) | Q(owner=user),
            created_at__gte=week_ago,
        ).count()

        stats = [
            {
                "icon":  "◉",
                "label": "Total Candidates",
                "value": f"{total_candidates:,}",
                "delta": f"+{new_this_week} this week",
                "pct":   min(int((total_candidates / max(total_candidates, 1)) * 100), 100),
            },
            {
                "icon":  "◈",
                "label": "Active Tests",
                "value": str(active_tests),
                "delta": f"+{new_tests_since_yesterday} since yesterday",
                "pct":   min(active_tests * 5, 100),
            },
            {
                "icon":  "◎",
                "label": "Total Attempts",
                "value": f"{total_assignments:,}",
                "delta": f"+{new_today} today",
                "pct":   min(int((total_assignments / max(total_assignments, 1)) * 100), 100),
            },
            {
                "icon":  "◆",
                "label": "Questions in DB",
                "value": f"{total_questions:,}",
                "delta": f"+{new_questions_week} this week",
                "pct":   min(int((total_questions / max(total_questions, 1)) * 100), 100),
            },
        ]

        # ── Recent Candidates (last 5) ────────────────────────────────────────
        recent_candidates = Candidate.objects.filter(
            owner=user
        ).order_by("-created_at")[:5]

        def joined_label(dt):
            delta = (now.date() - dt.date()).days
            if delta == 0:   return "Today"
            if delta == 1:   return "Yesterday"
            return f"{delta}d ago"

        users_data = [
            {
                "id":     c.id,
                "init":   "".join(w[0].upper() for w in c.name.split()[:2]),
                "name":   c.name,
                "email":  c.email,
                "role":   "Student",
                "joined": joined_label(c.created_at),
                "status": "Active",
            }
            for c in recent_candidates
        ]

        # ── Recent Tests (last 4) ─────────────────────────────────────────────
        recent_tests = Test.objects.filter(
            owner=user
        ).annotate(
            q_count   = Count("questions"),
            attempts  = Count("assignments"),
        ).order_by("-created_at")[:4]

        STATUS_LABEL = {"published": "Active", "draft": "Draft", "closed": "Archived"}

        tests_data = [
            {
                "id":        t.id,
                "title":     t.title,
                "attempts":  t.attempts,
                "questions": t.q_count,
                "duration":  f"{round(t.total_time_limit)} min" if t.total_time_limit else "—",
                "status":    STATUS_LABEL.get(t.status, t.status),
                "created":   t.created_at.strftime("%b %d"),
                "passMark":  t.pass_criteria,
            }
            for t in recent_tests
        ]

        # ── Recent Activity (last 4 entries) ─────────────────────────────────
        TYPE_COLOR = {
            "attempt":  "#6BE092",
            "score":    "#E0C96B",
            "user":     "#6BB0E0",
            "test":     "var(--gold)",
            "question": "var(--gold3)",
        }

        recent_logs = ActivityLog.objects.filter(
            owner=user
        ).order_by("-created_at")[:4]

        activity_data = [
            {
                "id":    a.id,
                "text":  a.text,
                "time":  a.time_ago,
                "color": TYPE_COLOR.get(a.type, "#6BE092"),
            }
            for a in recent_logs
        ]

        return Response({
            "stats":    stats,
            "users":    users_data,
            "tests":    tests_data,
            "activity": activity_data,
        })
    
# ─────────────────────────────────────────────────────────────────────────────
# PASSWORD RESET — 3-step flow
# ─────────────────────────────────────────────────────────────────────────────

class SendOTPView(APIView):
    """
    POST /api/password-reset/send-otp/
    Body: { email }
    Generates a 6-digit OTP, saves it, and emails it to the user.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]

        # Invalidate any existing unused OTPs for this email
        PasswordResetOTP.objects.filter(email=email, is_used=False).delete()

        # Create new OTP
        otp_code = PasswordResetOTP.generate_otp()
        PasswordResetOTP.objects.create(email=email, otp=otp_code)

        # Send email
        try:
                    send_mail(
                        subject="Your Skill Bridge Password Reset Code",
                        message=(
                            f"Dear User,\n\n"
                            f"We received a request to reset the password for your\n"
                            f"Skill Bridge account associated with this email address.\n\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"  YOUR ONE-TIME PASSWORD (OTP)\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                            f"              {otp_code}\n\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
                            f"  • This code is valid for 10 minutes only.\n"
                            f"  • Do not share this code with anyone.\n"
                            f"  • Skill Bridge will never ask for your OTP.\n\n"
                            f"If you did not request a password reset, please\n"
                            f"ignore this email. Your account remains secure and\n"
                            f"no changes have been made.\n\n"
                            f"Warm regards,\n"
                            f"The Skill Bridge Team\n"
                            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            f"This is an automated message. Please do not reply to this email."
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                    )

        except Exception as e:
            # In development, print OTP to console so you can test without email
            print(f"[DEV] OTP for {email}: {otp_code}")
            # Don't expose the error to the client
            return Response({
                "detail": "OTP sent successfully.",
                # Only include in DEBUG mode
                **({"otp": otp_code} if settings.DEBUG else {}),
            })

        return Response({"detail": "OTP sent successfully."})


class VerifyOTPView(APIView):
    """
    POST /api/password-reset/verify-otp/
    Body: { email, otp }
    Validates the OTP without consuming it (consumption happens on reset).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        otp   = serializer.validated_data["otp"]

        record = PasswordResetOTP.objects.filter(
            email=email, otp=otp, is_used=False
        ).order_by("-created_at").first()

        if not record:
            return Response(
                {"error": "Invalid OTP. Please check and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.is_expired():
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"detail": "OTP verified successfully."})


class ResetPasswordView(APIView):
    """
    POST /api/password-reset/reset/
    Body: { email, otp, password, confirm }
    Verifies OTP one final time, resets the password, marks OTP as used.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email    = serializer.validated_data["email"]
        otp      = serializer.validated_data["otp"]
        password = serializer.validated_data["password"]

        # Re-verify OTP before resetting
        record = PasswordResetOTP.objects.filter(
            email=email, otp=otp, is_used=False
        ).order_by("-created_at").first()

        if not record:
            return Response(
                {"error": "Invalid or already used OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.is_expired():
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reset the password
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.set_password(password)
        user.save()

        # Mark OTP as used so it can't be replayed
        record.is_used = True
        record.save(update_fields=["is_used"])

        # Blacklist all existing JWT refresh tokens for security
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            OutstandingToken.objects.filter(user=user).delete()
        except Exception:
            pass

        return Response({"detail": "Password reset successfully. Please log in."})
    
# ─────────────────────────────────────────────────────────────────────────────
# MALPRACTICE LOGGING
# ─────────────────────────────────────────────────────────────────────────────

class LogMalpracticeView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        test_id = request.data.get("test_id")
        name = request.data.get("name")
        email = request.data.get("email")
        event_type = request.data.get("event_type", "unknown")

        if not test_id:
            return Response({"error": "test_id is required."}, status=400)

        try:
            test = Test.objects.get(pk=test_id)
        except Test.DoesNotExist:
            return Response({"error": "Test not found."}, status=404)

        # ✅ Get or create candidate using email
        candidate = None
        if email:
            candidate, _ = Candidate.objects.get_or_create(
                owner=test.owner,
                email=email,
                defaults={"name": name}
            )

            if name and candidate.name != name:
                candidate.name = name
                candidate.save(update_fields=["name"])

        # ✅ Save malpractice log
        MalpracticeLog.objects.create(
            test=test,
            candidate=candidate,
            event_type=event_type,
        )

        candidate_name = candidate.name if candidate else "Unknown Candidate"

        # ✅ Activity log
        if test.owner:
            ActivityLog.objects.create(
                owner=test.owner,
                type="attempt",
                text=f"Proctoring alert: {event_type} during '{test.title}'",
                detail=f"Candidate: {candidate_name}",
            )

        return Response({
            "logged": True,
            "malpractice_detected": False
        })
# ─────────────────────────────────────────────────────────────────────────────
# TEST SUBMISSION + SCORING
# ─────────────────────────────────────────────────────────────────────────────
class SubmitTestView(APIView):
    """
    POST /api/submit-test/
    Accepts answers dict, scores them, saves submission, updates assignment.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TestSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data         = serializer.validated_data
        test_id      = data["test_id"]
        answers      = data["answers"]
        time_taken   = data.get("time_taken", 0)
        alert_count  = data.get("alert_count", 0)
        force_exited = data.get("force_exited", False)

        # ✅ NEW (get from request)
        email = request.data.get("email")
        name  = request.data.get("name")

        try:
            test = Test.objects.prefetch_related("questions").get(pk=test_id)
        except Test.DoesNotExist:
            return Response({"error": "Test not found."}, status=status.HTTP_404_NOT_FOUND)

        # ✅ GET OR CREATE CANDIDATE USING EMAIL
        candidate = None
        if email:
            candidate = Candidate.objects.filter(
                owner=test.owner,
                email=email
            ).first()

            if not candidate:
                candidate = Candidate.objects.create(
                    owner=test.owner,
                    name=name,
                    email=email
                )
            else:
                # update name if changed
                if name and candidate.name != name:
                    candidate.name = name
                    candidate.save(update_fields=["name"])

        # ── Score the answers ─────────────────────────────
        questions    = test.questions.all()
        marks_per_q  = test.marks_per_question or 1
        correct      = 0
        total        = questions.count()
        results      = {}

        for q in questions:
            student_answer = answers.get(str(q.id))
            is_correct     = False

            if q.type == "multiplechoice":
                is_correct = str(student_answer) == str(q.correct_answer)

            elif q.type == "multipleresponse":
                if isinstance(student_answer, list) and isinstance(q.correct_answer, list):
                    is_correct = sorted(student_answer) == sorted(q.correct_answer)

            elif q.type == "truefalse":
                is_correct = str(student_answer).lower() == str(q.correct_answer).lower()

            elif q.type == "fillintheblank":
                is_correct = (
                    str(student_answer).strip().lower() ==
                    str(q.correct_answer).strip().lower()
                )

            if is_correct:
                correct += 1

            mark = marks_per_q if is_correct else (
                -0.25 * marks_per_q if test.penalize_incorrect_answers and student_answer else 0
            )

            results[str(q.id)] = {
                "correct":        is_correct,
                "correct_answer": q.correct_answer,
                "student_answer": student_answer,
                "marks":          mark,
            }

        score        = correct * marks_per_q
        total_marks  = total * marks_per_q
        percentage   = round((score / total_marks * 100), 2) if total_marks > 0 else 0
        passed       = percentage >= (test.pass_criteria or 50)

        # ── Save submission ───────────────────────────────
        submission = TestSubmission.objects.create(
            test=test,
            candidate=candidate,
            answers=answers,
            score=score,
            total_marks=total_marks,
            percentage=percentage,
            passed=passed,
            time_taken=time_taken,
            alert_count=alert_count,
            force_exited=force_exited,
        )

        # ── Update assignment ─────────────────────────────
        # ── Update or create assignment ───────────────────
        if candidate:
            assignment, created = TestAssignment.objects.get_or_create(
                candidate=candidate,
                test=test,
                defaults={
                    "status":       "completed",
                    "score":        percentage,
                    "completed_at": timezone.now(),
                }
            )

            if not created:
                assignment.status       = "completed"
                assignment.score        = percentage
                assignment.completed_at = timezone.now()
                assignment.save(update_fields=["status", "score", "completed_at"])

        # ── Activity log ──────────────────────────────────
        candidate_name = candidate.name if candidate else "Unknown"

        if test.owner:
            ActivityLog.objects.create(
                owner=test.owner,
                type="score",
                text=f"{candidate_name} scored {percentage}% on '{test.title}'",
                detail=f"Score: {percentage}% | {'Passed' if passed else 'Failed'}",
            )

        # ── Notification ──────────────────────────────────
        if test.owner:
            Notification.objects.create(
                user=test.owner,
                text=f"{candidate_name} completed '{test.title}' with {percentage}%",
                type="TEST_COMPLETED",
                is_read=False,
            )

        return Response({
            "submission_id": submission.id,
            "score":         score,
            "total_marks":   total_marks,
            "percentage":    percentage,
            "passed":        passed,
            "correct":       correct,
            "total":         total,
            "results":       results,
            "conclusion":    test.conclusion,
        }, status=status.HTTP_201_CREATED)


class MalpracticeLogListView(generics.ListAPIView):
    """GET /api/tests/<test_id>/malpractice/ → admin views proctoring logs"""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]
    serializer_class       = MalpracticeLogSerializer

    def get_queryset(self):
        return MalpracticeLog.objects.filter(
            test_id=self.kwargs["test_id"],
            test__owner=self.request.user,
        )