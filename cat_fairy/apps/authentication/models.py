import jwt

from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.db import models

from cat_fairy.apps.core.models import TimestampedModel


class UserManager(BaseUserManager):
    def create_user(self, username, github_id, email=None, password=None):
        if username is None:
            raise TypeError('Users must have a username.')

        if github_id is None:
            raise TypeError('Users must have a github_id.')

        user = self.model(username=username, email=self.normalize_email(email), github_id=github_id)
        user.set_password(password)
        user.save()

        return user

    def create_superuser(self, username, github_id, password, email=None):
        if password is None:
            raise TypeError('Superusers must have a password.')

        user = self.create_user(username, github_id, password, email)
        user.is_superuser = True
        user.is_staff = True
        user.save()

        return user


class User(AbstractBaseUser, PermissionsMixin, TimestampedModel):
    username = models.CharField(db_index=True, max_length=255, unique=True)
    email = models.EmailField(default=None, null=True)
    github_id = models.CharField(db_index=True, max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['github_id']

    objects = UserManager()

    def __str__(self):
        return self.username

    @property
    def token(self):
        return self._generate_jwt_token()

    def get_full_name(self):
        return self.username

    def get_short_name(self):
        return self.username

    def _generate_jwt_token(self) -> object:
        dt = datetime.now() + timedelta(days=60)

        token = jwt.encode({
            'id': self.pk,
            'username': self.username,
            'github_id': self.github_id,
            'exp': int(dt.strftime('%s'))
        }, settings.SECRET_KEY, algorithm='HS256')

        return token.decode('utf-8')
