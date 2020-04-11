from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User

from .renderers import UserJSONRenderer
from .serializers import (
    UserSerializer, LoginSerializer
)

from django.conf import settings

from django.shortcuts import redirect

import requests


class GithubCallbackAPIView(APIView):
    permission_classes = (AllowAny,)
    renderer_classes = (UserJSONRenderer,)
    serializer_class = UserSerializer

    def get(self, request):
        user_info = self._github_auth_process(request)
        user = User.objects.get(github_id=user_info['id'])

        # todo - response with user data
        if user:
            return Response(user)

        else:
            user = {'username': user_info['login'], 'email': user_info['email'], 'github_id': user_info['id']}
            serializer = UserSerializer(data=user)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _github_auth_process(self, request):
        code = request.query_params.get('code')
        token = self._get_token(code)
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
@renderer_classes(UserJSONRenderer)
def registration_api_view(request):
    user = request.data.get('user', {})

    return Response(_registration(user), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@renderer_classes(UserJSONRenderer)
def login_api_view(request):
    user = request.data.get('user', {})
    return Response(_login(user),  status=status.HTTP_200_OK)


class UserRetrieveUpdateAPIView(RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    renderer_classes = (UserJSONRenderer,)
    serializer_class = UserSerializer

    def retrieve(self, request, *args, **kwargs):
        serializer = self.serializer_class(request.user)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        user_data = request.data.get('user', {})

        serializer_data = {
            'username': user_data.get('username', request.user.username),
            'email': user_data.get('email', request.user.email),
        }

        serializer = self.serializer_class(
            request.user, data=serializer_data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)



# <div className="App">
#       <a
#           className="App-link"
#           href="https://github.com/login/oauth/authorize?client_id=5c82987314849c415fa5&scope=user"
#           target="_blank"
#           rel="noopener noreferrer"
#         >
#           github
#         </a>
#     </div>