from django.urls import path, include
from . import views

urlpatterns = [
    
    path("", views.index, name="home"),
    path('course_details/<slug>/', views.course_details, name='course_details'),
    path('contact',views.contact,name="contact"),
    path("about", views.about, name="about"),
    path("login",views.login_page,name="login"),
    path("register",views.register_page,name="register"),
    path('logout', views.logout_page,name='logout'),
    path('forget-password',views.forget_password, name="forget-password"),
    path('change-password/<token>/', views.change_password, name='change-password'),
    path('become-pro', views.become_pro, name='become-pro'),
    path('success', views.success, name='success'),
    path('already-pro', views.already_pro, name = 'already-pro')
    
]
