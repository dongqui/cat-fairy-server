from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register('cat', views.CatView)

urlpatterns = [
    path('', include(router.urls))
]
