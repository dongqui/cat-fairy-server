from django.contrib.auth import authenticate

from rest_framework import serializers

from .models import User

from django.conf import settings

import jwt


class LoginSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=255, read_only=True)

    def validate(self, data):
        print(data.keys())
        try:
            decoded = jwt.decode(data, settings.SECRET_KEY, 'HS256')
            user = authenticate(username=decoded.username)
            if user is None:
                raise serializers.ValidationError(
                    'A user with this username was not found.'
                )
            if not user.is_active:
                raise serializers.ValidationError(
                    'This user has been deactivated.'
                )
            return {
                'email': user.email,
                'username': user.username,
                'token': user.token
            }

        except jwt.ExpiredSignatureError:
            pass


class UserSerializer(serializers.ModelSerializer):
    """Handles serialization and deserialization of User objects."""
    token = serializers.CharField(max_length=255, read_only=True)

    class Meta:
        model = User
        fields = (
            'email', 'username', 'token', 'github_id'
        )
        read_only_fields = ('token',)

    def update(self, instance, validated_data):
        """Performs an update on a User."""
        for (key, value) in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        return instance

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
