from django.conf.urls import url

from .views import (
    login_api_view, registration_api_view, UserRetrieveUpdateAPIView, GithubCallbackAPIView
)

urlpatterns = [
    url(r'^user/?$', UserRetrieveUpdateAPIView.as_view()),
    url(r'^users/?$', registration_api_view, name='registration'),
    url(r'^auth/github/?$', GithubCallbackAPIView.as_view(), name='github'),
    url(r'^auth/login/?$', login_api_view, name='login'),
]
