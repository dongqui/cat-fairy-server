from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes, renderer_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User

from .renderers import UserJSONRenderer
from .serializers import (
    UserSerializer, LoginSerializer
)
from .backends import JWTAuthentication

from django.conf import settings

import requests


class GithubCallbackAPIView(APIView):
    permission_classes = (AllowAny,)
    renderer_classes = (UserJSONRenderer,)
    serializer_class = UserSerializer

    def post(self, request):
        user_info = self._github_auth_process(request)
        user = User.objects.get_or_none(github_id=user_info['id'])

        if user:
            serializer = UserSerializer(user)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        else:
            user = {'username': user_info['login'], 'email': user_info['email'], 'github_id': user_info['id']}
            print(user)
            serializer = UserSerializer(data=user)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _github_auth_process(self, request):
        data = request.data
        token = self._get_token(data['code'])
        user_info = self._get_user_info(token)

        return user_info

    def _get_token(self, code):
        params = {'client_id': settings.GITHUB_CLIENT_ID, 'client_secret': settings.GITHUB_CLIENT_SECRET,
                  'code': code}
        headers = {'Accept': 'application/json'}
        res = requests.post(f'https://github.com/login/oauth/access_token', params=params, headers=headers)
        result = res.json()

        return result['access_token']

    def _get_user_info(self, token):
        headers = {'Authorization': f'token {token}'}
        res = requests.get('https://api.github.com/user', headers=headers)
        result = res.json()

        return result


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
@renderer_classes([UserJSONRenderer])
def login_api_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data,  status=status.HTTP_201_CREATED)

