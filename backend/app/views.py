from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import (
    Role, Category, Test, Question, TestQuestion, TestAttempt, TestResult,
    ProctoringSession, ProctoringLog, Leaderboard, Achievement, UserProfile,
    Notification, PasswordReset, AnalyticsReport, TestProctoringSetting,
    QuestionImportLog, UserActivityLog
)
from .serializers import (
    RoleSerializer, UserSerializer, UserMinimalSerializer, CategorySerializer, 
    CategoryMinimalSerializer, TestSerializer, QuestionSerializer, 
    TestQuestionSerializer, TestAttemptSerializer, TestResultSerializer, 
    ProctoringSessionSerializer, ProctoringLogSerializer, LeaderboardSerializer, 
    AchievementSerializer, UserProfileSerializer, NotificationSerializer, 
    PasswordResetSerializer, AnalyticsReportSerializer, 
    TestProctoringSettingSerializer, QuestionImportLogSerializer, 
    UserActivityLogSerializer
)

# Register View (User Registration API)
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'username': user.username,
                'email': user.email,
                'password': user.password,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# JWT Token View (Login API)
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]  # Allow any user to log in
    # This will automatically handle the login and return the JWT tokens
    def post(self, request):
        # Retrieve username and password from request data
        username = request.data.get('username')
        password = request.data.get('password')

        # Check if username and password are provided
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user
        user = authenticate(username=username, password=password)

        # Check if authentication was successful
        if user is not None:
            # Generate token for the user
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'username': user.username,
                'email': user.email,
                'token': token.key
            }, status=status.HTTP_200_OK)

        # If authentication fails, return an error
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# User Detail View (Get the authenticated user details)
class UserDetailView(APIView):
    # authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]  # Requires the user to be authenticated

    def get(self, request):
        # Assuming you're using the User model, change it if you're using a custom User model
        user = request.user  # This gets the user from the JWT token
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined,
        })

# Role ViewSet
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

# User ViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return UserMinimalSerializer
        return UserSerializer

# Category ViewSet
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CategoryMinimalSerializer
        return CategorySerializer

# Test ViewSet
class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [IsAuthenticated]

# Question ViewSet
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

# TestQuestion ViewSet
class TestQuestionViewSet(viewsets.ModelViewSet):
    queryset = TestQuestion.objects.all()
    serializer_class = TestQuestionSerializer
    permission_classes = [IsAuthenticated]

# TestAttempt ViewSet
class TestAttemptViewSet(viewsets.ModelViewSet):
    queryset = TestAttempt.objects.all()
    serializer_class = TestAttemptSerializer
    permission_classes = [IsAuthenticated]

# TestResult ViewSet
class TestResultViewSet(viewsets.ModelViewSet):
    queryset = TestResult.objects.all()
    serializer_class = TestResultSerializer
    permission_classes = [IsAuthenticated]

# ProctoringSession ViewSet
class ProctoringSessionViewSet(viewsets.ModelViewSet):
    queryset = ProctoringSession.objects.all()
    serializer_class = ProctoringSessionSerializer
    permission_classes = [IsAuthenticated]

# ProctoringLog ViewSet
class ProctoringLogViewSet(viewsets.ModelViewSet):
    queryset = ProctoringLog.objects.all()
    serializer_class = ProctoringLogSerializer
    permission_classes = [IsAuthenticated]

# Leaderboard ViewSet
class LeaderboardViewSet(viewsets.ModelViewSet):
    queryset = Leaderboard.objects.all()
    serializer_class = LeaderboardSerializer
    permission_classes = [IsAuthenticated]

# Achievement ViewSet
class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]

# UserProfile ViewSet
class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

# Notification ViewSet
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

# PasswordReset ViewSet
class PasswordResetViewSet(viewsets.ModelViewSet):
    queryset = PasswordReset.objects.all()
    serializer_class = PasswordResetSerializer
    permission_classes = [IsAuthenticated]

# AnalyticsReport ViewSet
class AnalyticsReportViewSet(viewsets.ModelViewSet):
    queryset = AnalyticsReport.objects.all()
    serializer_class = AnalyticsReportSerializer
    permission_classes = [IsAuthenticated]

# TestProctoringSetting ViewSet
class TestProctoringSettingViewSet(viewsets.ModelViewSet):
    queryset = TestProctoringSetting.objects.all()
    serializer_class = TestProctoringSettingSerializer
    permission_classes = [IsAuthenticated]

# QuestionImportLog ViewSet
class QuestionImportLogViewSet(viewsets.ModelViewSet):
    queryset = QuestionImportLog.objects.all()
    serializer_class = QuestionImportLogSerializer
    permission_classes = [IsAuthenticated]

# UserActivityLog ViewSet
class UserActivityLogViewSet(viewsets.ModelViewSet):
    queryset = UserActivityLog.objects.all()
    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAuthenticated]
