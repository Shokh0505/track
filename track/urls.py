from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup, name='signup'),
    path('save_goal/', views.save_goal, name='save_goal'),
    path('list_goals/', views.list_goals, name='list_goals'),
    path('list_steps/', views.list_steps, name='list_steps'),
    path('save_step/', views.save_step, name='save_step'),
    path('save_duration/', views.save_duration, name='save_duration'),
    path('time_week/', views.time_week, name='name_week'),
    path('save_hours/', views.save_hours, name='save_hours'),
    path('get_percentage/', views.get_percentage, name='get_percentage'),
    path('start_time/', views.start_timer, name='start_timer'),
    path('stop_timer/', views.stop_timer, name='stop_timer'),
    path('get_percentage_day/', views.get_percentage_step_day, name='get_percentage_day'),
    path('get_percentage_week/', views.get_percentage_step_week, name='get_percentage_week')
]
