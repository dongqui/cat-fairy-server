from django.conf.urls import url

from .views import (
    login_api_view, GithubCallbackAPIView
)

urlpatterns = [
    # url(r'^user/?$', UserRetrieveUpdateAPIView.as_view()),
    url(r'^auth/github/?$', GithubCallbackAPIView.as_view(), name='github'),
    url(r'^auth/login/?$', login_api_view, name='login'),
]
