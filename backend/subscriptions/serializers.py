from rest_framework import serializers

from subscriptions.models import Subscription, SubscriptionList


class SubscriptionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionList
        fields = ['id', 'subscription_list', 'subscription_price']


class SubscriptionSerializer(serializers.ModelSerializer):
    subscription_list = SubscriptionListSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'subscription_list', 'is_pro']


class BecomeProSerializer(serializers.Serializer):
    membership = serializers.IntegerField()
    stripe_token = serializers.CharField()
