from django.conf import settings
from django.db import models


class SubscriptionList(models.Model):
    subscription_list = models.CharField(max_length=100)
    subscription_price = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['subscription_price']

    def __str__(self) -> str:
        return self.subscription_list


class Subscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    subscription_list = models.ForeignKey(
        SubscriptionList,
        on_delete=models.CASCADE,
    )
    is_pro = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.user.email
