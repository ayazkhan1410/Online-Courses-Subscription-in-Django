from rest_framework import generics
from rest_framework.permissions import AllowAny

from contact.models import Contact
from contact.serializers import ContactSerializer


class ContactCreateAPIView(generics.CreateAPIView):
    """Submit a contact form message."""

    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    queryset = Contact.objects.all()
