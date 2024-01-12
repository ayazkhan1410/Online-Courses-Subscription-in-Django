from django.shortcuts import render, redirect
from .models import (Courses, CourseModule,Contact, Profile, Subscription, SubscriptionList)
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db.models import Q
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from .models import CustomUser as User
from django.contrib.auth.decorators import login_required
from .helpers import *
import uuid
import stripe
from django.conf import settings
from datetime import datetime, timedelta

# Create your views here.

def index(request): 
    courses = Courses.objects.all()
    
    # Check if the user is authenticated
    if request.user.is_authenticated:
        obj = Subscription.objects.filter(user = request.user).first()
        # By adding the condition if obj is not None:, you ensure that the session key obj is set only when a subscription object is found for the authenticated user
        if obj is not None:
            request.session['obj'] = obj.is_pro                
    search = request.GET.get("search")
    
    if search:
       courses = courses.filter(
       Q(courses_name__icontains = search) |
       Q(courses_description__icontains = search)
       )
       
    page = request.GET.get('page')
    paginator = Paginator(courses, 8)
    
    try:
        courses = paginator.get_page(page)
    except PageNotAnInteger:
        courses = paginator.get_page(1)
    except EmptyPage:
        courses = paginator.page(paginator.num_pages)
       
    context = {
        "courses": courses,
        
    }
    return render(request,"index.html",context)

@login_required(login_url="/login")
def course_details(request, slug):
    
    # Retrieve a single course based on the provided slug
    course = Courses.objects.filter(slug=slug).first()
    # Retrieve all modules related to the obtained course
    course_modules = CourseModule.objects.filter(course=course)
        
    context = {"course":course,
               "course_modules" : course_modules,
               }
    
    return render(request,'course_details.html',context)

def contact(request):
    queryset = Contact.objects.all()
        
    if request.method == "POST":
        
        name = request.POST.get("name")
        email = request.POST.get("email")
        message = request.POST.get("message")
        
        # the left side name, email, message denoted to model name, email and message
        queryset = Contact.objects.create(name = name,
                                          email=email,
                                          message= message
        )
        
        queryset.save()
        messages.info(request,"Your message has been summited")
        return redirect("/contact")

    return render(request,'contact.html')

def about(request):
    
    return render(request,"about.html")

def login_page(request):
    
    if request.method != "POST":
        return render(request,"login.html")
    email = request.POST.get('email')
    password = request.POST.get("password")

    if  not User.objects.filter(email=email).exists():
        messages.warning(request,"Please Create Account First")
        
        
    user = authenticate(email=email, password=password)
    
    if user is None:
        messages.info(request,"Invalid Password")
        return redirect("/login")
    
    login(request, user)
    
    redirect_url = request.GET.get('next') 
    if redirect_url:
        return redirect(redirect_url)
    else:
        return redirect('/')

def register_page(request):
    
    if request.method != "POST":
        return render(request,'register.html')
    username = request.POST.get('username')
    email = request.POST.get('email')
    password = request.POST.get('password')

    if User.objects.filter(email=email).exists():
        messages.info(request,"Email already exisits")
        return redirect("/register")
    else:
        queryset = User.objects.create(username=username,
                                       email = email
                                       )
        queryset.set_password(password)
        queryset.save()
        messages.success(request, "Account created successfully")
        return redirect("/login")
def change_password(request , token):
    try:
        profile_obj = Profile.objects.filter( forget_token = token).first()
        if request.method == "POST":
            
            password = request.POST.get('password')
            confirm_password =request.POST.get('confirm_password')
            
            if password != confirm_password:
                messages.info(request,"Password does not match")
                return redirect(f"/change-password/{token}")
            
            else:
                user_obj = User.objects.get(email = profile_obj.user.email)
                user_obj.set_password(password)
                user_obj.save()
                messages.success(request,"Password changed successfully")
                return redirect("/login")
            
    except Exception as e:
        print(e)
    return render(request, 'change-password.html')

def forget_password(request):
    try:
        if request.method == "POST":
            email = request.POST.get('email')
            
            # Use .exists() with User.objects.filter(), not with User.objects.get()
            if not User.objects.filter(email=email).exists():
                messages.info(request, "Email does not exist")
                return redirect("/register")
            
            user_obj = User.objects.get(email=email)  # Remove .first() from here
            
            token = str(uuid.uuid4())
            
            profile_obj, created = Profile.objects.get_or_create(user=user_obj)
            profile_obj.forget_token = token
            profile_obj.save()
            
            send_email(user_obj.email, token)
            
            messages.success(request, 'An email has been sent.')
            return redirect('/forget-password')
            
    except Exception as e:
        print(e)
    return render(request, 'forget-password.html')

stripe.api_key = settings.STRIPE_SECRET_KEY

@login_required(login_url='/login')
def become_pro(request):
    
        # take all the subscription list from the database
        sub_obj = SubscriptionList.objects.all()            
        if request.method == 'POST':
            # take the selected subscription from the form
            subscription_id = request.POST.get('membership')
            # printing for debubbging
            print(subscription_id)
            try:
                # Check if the selected subscription exists in the database
                if subscription_id:
                    # Retrieve the selected subscription from the database
                    selected_subscription = SubscriptionList.objects.get(id=subscription_id)
                # Create a Stripe Payment Intent
                    stripe.api_key = settings.STRIPE_SECRET_KEY
                    customer = stripe.Customer.create(
                    email = request.user.email,
                    source=request.POST['stripeToken']
                    )
                    # Creating a Charge
                    charge = stripe.Charge.create(
                        customer=customer,
                        amount=selected_subscription.subscription_price*100,
                        currency="PKR",
                        description="Payment has been charged"
                    )   
                    print(charge)                                 
                    if charge['paid'] == True:
                        # Check if a subscription exists for the current user
                        user_obj = Subscription.objects.filter(user=request.user).first()
                        if user_obj:
                            # If the user already has a subscription, update the existing subscription details
                            user_obj.subscription_list = selected_subscription
                            user_obj.is_pro = True
                            user_obj.save()
                            return redirect('success')  # Redirect to 'success' page if the payment is successful and subscription updated
                        else:
                            # If the user doesn't have a subscription, create a new subscription for the user
                            new_subscription = Subscription.objects.create(
                                user=request.user,
                                subscription_list=selected_subscription,
                                is_pro=True
                            )
                            new_subscription.save()
                        
                        messages.success(request, "Payment successful!") 
                        return redirect('success')  
                    
            except Exception as e:
                print(e)
                messages.warning(request, "Payment failed!")
                
        context = {'sub_obj':sub_obj}
        return render(request, 'become-pro.html', context)
    
def success(request):
    return render(request, "success.html")

def already_pro(request):
        return render(request, 'already-pro.html')  

def logout_page(request):
    logout(request)
    return redirect('/')