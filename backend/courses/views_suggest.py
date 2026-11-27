from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.serializers_suggest import PlaylistSuggestionSerializer


class PlaylistSuggestionCreateAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'playlist_suggest'

    def post(self, request):
        serializer = PlaylistSuggestionSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)