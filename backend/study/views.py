import logging
import uuid

import stripe
from django.conf import settings
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from study.helpers import send_email
from study.models import (
    Contact,
    Courses,
    CustomUser,
    Profile,
    Subscription,
    SubscriptionList,
)
from study.serializers import (
    BecomeProSerializer,
    ChangePasswordSerializer,
    ContactSerializer,
    CourseDetailSerializer,
    CourseSerializer,
    ForgetPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    SubscriptionListSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


class CourseListAPIView(generics.ListAPIView):
    """List courses with optional search and pagination."""

    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Courses.objects.all().order_by('id')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(courses_name__icontains=search)
                | Q(courses_description__icontains=search)
            )
        return queryset


class CourseDetailAPIView(generics.RetrieveAPIView):
    """Retrieve a single course with its modules."""

    serializer_class = CourseDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'
    queryset = Courses.objects.prefetch_related('course_modules').all()


class ContactCreateAPIView(generics.CreateAPIView):
    """Submit a contact form message."""

    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    queryset = Contact.objects.all()


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                'message': 'Account created successfully',
                'token': token.key,
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        django_login(request, user)
        return Response(
            {
                'message': 'Login successful',
                'token': token.key,
                'user': UserSerializer(user).data,
            }
        )


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        django_logout(request)
        return Response({'message': 'Logged out successfully'})


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ForgetPasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user_obj = CustomUser.objects.get(email=email)
        token = str(uuid.uuid4())
        profile_obj, _ = Profile.objects.get_or_create(
            user=user_obj,
            defaults={'forget_token': token},
        )
        profile_obj.forget_token = token
        profile_obj.save()
        send_email(user_obj.email, token)
        return Response({'message': 'An email has been sent.'})


class ChangePasswordAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        profile_obj = Profile.objects.filter(forget_token=token).first()
        if profile_obj is None:
            return Response(
                {'detail': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_obj = profile_obj.user
        user_obj.set_password(serializer.validated_data['password'])
        user_obj.save()
        profile_obj.forget_token = ''
        profile_obj.save()
        return Response({'message': 'Password changed successfully'})


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
            logger.exception('Stripe payment failed for %s', request.user.email)
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
