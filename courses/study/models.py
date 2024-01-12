from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from embed_video.fields import EmbedVideoField


class Courses(models.Model):
    courses_name = models.CharField(max_length = 100)
    courses_description = RichTextField()
    is_premium = models.BooleanField(default=False)
    course_image = models.ImageField(upload_to="courses")
    slug = models.SlugField(blank=True, unique=True)
    
    def save(self, *args, **kwargs):
        #this line below give to the instance slug field a slug name
        self.slug = slugify(self.courses_name)
        #this line below save every fields of the model instance
        super(Courses, self).save(*args, **kwargs)    
        
    def __str__(self) -> str:
        return self.courses_name
     
class CourseModule(models.Model):
    
    course = models.ForeignKey(Courses, on_delete=models.CASCADE, related_name="course_modules")
    module_name = models.CharField(max_length=100)
    module_description = RichTextField()
    module_video = EmbedVideoField(max_length = 500)
    can_view = models.BooleanField(default=False)
    
    def __str__(self) -> str:
        return self.module_name

class Contact(models.Model):
    name = models.CharField(max_length = 100)
    email = models.EmailField(max_length = 100)
    message = models.TextField(max_length = 300)    
    
    def __str__(self) -> str:
        return self.email

class CustomUser(AbstractUser):
    
    username = models.CharField(max_length=40, null=True, blank=True)
    full_name = models.CharField(max_length=40)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=40, null=False, blank=False)
    confirm_password = models.CharField(max_length=40, null=False, blank=False)
    user_choices = models.CharField(max_length=30, choices=[
        ('expert', 'Expert'),
        ('business', 'Business'),
        ('admin', 'Admin')
    ]
                                    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email}"

class Profile(models.Model):
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    forget_token = models.CharField(max_length = 100)

class SubscriptionList(models.Model):
    subscription_list = models.CharField(max_length = 100)
    subscription_price = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['subscription_price']
    
    def __str__(self) -> str:
        return self.subscription_list

class Subscription(models.Model):
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    subscription_list = models.ForeignKey(SubscriptionList, on_delete=models.CASCADE)
    is_pro = models.BooleanField(default=False)
    
    
    
    def __str__(self) -> str:
        return self.user.email
    
    
    
    
    
        