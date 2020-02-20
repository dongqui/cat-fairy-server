from django.db import models


class Item(models.Model):
    name = models.CharField(max_length=50)
    image = models.URLField()
    price = models.IntegerField(default=0)
