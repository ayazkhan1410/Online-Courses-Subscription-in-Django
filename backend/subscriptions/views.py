from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from subscriptions.serializers import (
    BecomeProSerializer,
    SubscriptionListSerializer,
)
from utils.subscriptions import list_plans, upgrade_to_pro


class SubscriptionListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            SubscriptionListSerializer(list_plans(), many=True).data
        )


class BecomeProAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BecomeProSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            upgrade_to_pro(
                request.user,
                serializer.validated_data['membership'],
                serializer.validated_data['stripe_token'],
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )
        except RuntimeError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
        return Response({'message': 'Payment successful!'})
