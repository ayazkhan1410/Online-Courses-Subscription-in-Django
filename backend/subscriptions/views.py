import logging

import stripe
from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from subscriptions.models import Subscription, SubscriptionList
from subscriptions.serializers import (
    BecomeProSerializer,
    SubscriptionListSerializer,
)

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


class SubscriptionListAPIView(generics.ListAPIView):
    serializer_class = SubscriptionListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    queryset = SubscriptionList.objects.all()


class BecomeProAPIView(APIView):
    """Process Stripe payment and upgrade user to pro."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BecomeProSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscription_id = serializer.validated_data['membership']
        stripe_token = serializer.validated_data['stripe_token']

        try:
            selected_subscription = SubscriptionList.objects.get(id=subscription_id)
        except SubscriptionList.DoesNotExist:
            return Response(
                {'detail': 'Invalid membership'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            customer = stripe.Customer.create(
                email=request.user.email,
                source=stripe_token,
            )
            charge = stripe.Charge.create(
                customer=customer.id,
                amount=selected_subscription.subscription_price * 100,
                currency='PKR',
                description='Payment has been charged',
            )
            if not charge.get('paid'):
                return Response(
                    {'detail': 'Payment failed'},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

            user_obj = Subscription.objects.filter(user=request.user).first()
            if user_obj:
                user_obj.subscription_list = selected_subscription
                user_obj.is_pro = True
                user_obj.save()
            else:
                Subscription.objects.create(
                    user=request.user,
                    subscription_list=selected_subscription,
                    is_pro=True,
                )
            return Response({'message': 'Payment successful!'})
        except Exception:
            logger.exception(
                'Stripe payment failed for %s',
                request.user.email,
            )
            return Response(
                {'detail': 'Payment failed'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


class ConfigAPIView(APIView):
    """Public frontend config (publishable keys only)."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                'stripe_publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
            }
        )
