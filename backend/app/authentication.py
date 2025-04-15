from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import CustomUser  

class UserTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Token "):
            return None  

        token = auth_header.split(" ")[1]  

        try:
            user = CustomUser.objects.get(user_token=token)  # Check latest token
        except CustomUser.DoesNotExist:
            raise AuthenticationFailed("Invalid token")

        return (user, None)