"""Subscription / Stripe helpers."""

from __future__ import annotations

import logging

import stripe
from django.conf import settings

from subscriptions.models import Subscription, SubscriptionList

logger = logging.getLogger(__name__)


def list_plans():
    return SubscriptionList.objects.all()


def upgrade_to_pro(user, membership_id: int, stripe_token: str) -> None:
    """Charge Stripe and mark the user as Pro. Raises ValueError/RuntimeError."""
    try:
        plan = SubscriptionList.objects.get(id=membership_id)
    except SubscriptionList.DoesNotExist as exc:
        raise ValueError('Invalid membership') from exc

    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        customer = stripe.Customer.create(
            email=user.email,
            source=stripe_token,
        )
        charge = stripe.Charge.create(
            customer=customer.id,
            amount=plan.subscription_price * 100,
            currency='PKR',
            description='Payment has been charged',
        )
    except Exception as exc:
        logger.exception('Stripe payment failed for %s', user.email)
        raise RuntimeError('Payment failed') from exc

    if not charge.get('paid'):
        raise RuntimeError('Payment failed')

    sub, created = Subscription.objects.get_or_create(
        user=user,
        defaults={'subscription_list': plan, 'is_pro': True},
    )
    if not created:
        sub.subscription_list = plan
        sub.is_pro = True
        sub.save(update_fields=['subscription_list', 'is_pro'])
