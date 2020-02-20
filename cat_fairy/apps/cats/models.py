from django.db import models


class Cat(models.Model):
    name = models.CharField(max_length=50)
    image = models.URLField(max_length=255)

