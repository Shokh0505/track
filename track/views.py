from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth import login, authenticate
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import User, Goal, Step, TimeLog
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializer import GoalSerializer, StepSerializer
from datetime import timedelta
import json

# Create your views here.
@login_required
def index(request):
    return render(request, 'track/index.html')

def login_view(request):
    if request.method == 'GET':
        return render(request, 'track/login.html')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            login(request, user)
            return redirect('index')
        
        return HttpResponse('The username or password is invalid')
    
def signup(request):
    if request.method == 'GET':
        return render(request, 'track/signup.html')
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        if not username or not email or not password:
            return HttpResponse("Some field has not been provided")

        user = User(username=username, email=email)
        if not user.is_unique(username):
            return HttpResponse("The username has already been taken")
        user.set_password(password)
        user.save()

        return redirect('login')
    
def save_goal(request):
    if(request.method == 'POST'):
        data = json.loads(request.body)
        user = request.user

        goal = Goal(
            user=user,
            title=data['goal'].lower()
        )

        goal.save()
        return JsonResponse({'message': 'successfully created the goal', 'goal_id': goal.id}, status=200)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_goals(request):
    user = request.user
    goals = user.goals.all()

    serializer = GoalSerializer(goals, many=True)

    return Response(serializer.data, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_steps(request):
    user = request.user

    steps = Step.objects.filter(goal__in=user.goals.all())

    serializer = StepSerializer(steps, many=True)

    return Response(serializer.data, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_step(request):
    user = request.user
    data = request.data
    
    goal_id = data.get('goal_id')
    step = data.get('step')

    # Retreive the goal and save the step
    try:
        goal = Goal.objects.get(id=goal_id)
    except ObjectDoesNotExist:
        return Response({'message': 'Do not play with the html of the page, boy!'}, status=400)
    except MultipleObjectsReturned:
        return Response({'message': 'Something went wrong!'}, status=400)

    step = Step(
        goal=goal,
        step_title=step
    )

    step.save()
    return Response({'message': 'successfully created the step', 'step_id': step.id}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_duration(request):
    data = request.data
    duration_string = data.get('time')
    step_id = data.get('step_id')

    step = Step.objects.get(id=step_id)

    if not duration_string or not step_id:
        return Response({'message': 'required fields have not been provided'}, status=400)

    try:
        hours, minutes, seconds = map(int, duration_string.split(':'))
        duration = timedelta(hours=hours, minutes=minutes, seconds=seconds)
        step.time_spend = step.time_spend + duration

        step.save()
        return Response({'message': 'successfully save the duration'}, status=200)
    except Exception as e:
        print("Invalid: ", e)
        return Response({'message': 'error with the provided string'}, status=400)
    except Step.DoesNotExist:
        return Response({'message': 'step does not exist'}, status=400)
    except ValueError:
        return Response({'message': 'Invalid time format'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def time_week(request):
    step_id = request.data.get('step_id')

    try:
        step = Step.objects.get(id=step_id)
    except ObjectDoesNotExist:
        return Response({'message': 'HTML of the page has been corrupted'}, status=400)
    
    duration = step.hours_week
    duration = duration.total_seconds() / 3600

    return Response({'message': 'successful', 'duration': duration}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_hours(request):
    step_id = request.data.get('step_id')
    hours = request.data.get('hours')

    try:
        hours = int(hours)
    except ValueError:
        return Response({'message': 'Incorrect form of hours were given'}, status=400)

    try:
        step = Step.objects.get(id=step_id)
    except ObjectDoesNotExist:
        return Response({'message': 'HTML of the file has been corrupted'}, status=400)
    
    step.hours_week = timedelta(hours=hours)
    step.save()
    return Response({'message': 'Successfully update the hours per week'}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_percentage(request):
    step_id = request.data.get('step_id')

    if not step_id:
        return Response({'message': 'invalid id has been provided'}, status=400)
    
    try:
        step = Step.objects.get(id=step_id)
        goal = step.goal
        steps = goal.steps.all()
    except ObjectDoesNotExist:
        return Response({'message': 'There is not such step in the database'}, status=400)
    
    total_time = timedelta(0)

    for time in steps:
        total_time += time.total_time_spend

    total_hours = total_time.total_seconds() / 3600
    total_hours_goal = round(total_hours, 3)

    return Response({'hours': total_hours_goal},status=200)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_timer(request):
    step_id = request.data.get('step_id')
    step = get_object_or_404(Step, id=step_id, goal__user=request.user)

    time_log = TimeLog.objects.create(step=step, start_time=timezone.now())

    return Response({'message': 'Successfully started the timer', 'time_log_id': time_log.id}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_timer(request):
    time_log_id = request.data.get('time_log_id')

    time_log = get_object_or_404(TimeLog, id=time_log_id, step__goal__user=request.user)
    time_log.end_time = timezone.now()
    time_log.duration = time_log.end_time - time_log.start_time
    time_log.save()

    return Response({'message': 'Successfully stopped the timer', 'duration': time_log.duration})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_percentage_step_day(request):
    step_id = request.data.get('step_id')

    step = get_object_or_404(Step, id=step_id, goal__user=request.user)
    
    hours_for_day =step.hours_week.total_seconds() / (7 * 3600)
    time_spend_today = step.time_spend_today().total_seconds() / 3600

    percentage = (time_spend_today / hours_for_day) * 100 if hours_for_day > 0 else 0
    percentage = round(percentage, 1)

    return Response({'message': 'Success', 'percentage': percentage}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_percentage_step_week(request):
    goal_id = request.data.get('goal_id')

    # Get all the necessary times for calculating percentages
    goal = get_object_or_404(Goal, id=goal_id, user=request.user)
    goal_time_week = round(goal.thours_week(), 2)
    goal_time_planned_week = round(goal.thours_week_planned(), 2)
    goal_time_total = round(goal.total_time_spend(), 2)
    time_spend_today = round(goal.hours_today(), 1)

    if goal_time_planned_week == 0:
        return Response({'week_planned': False}, status=200)
    
    week_percentage = round((goal_time_week / goal_time_planned_week) * 100, 1) 
        

    return Response({
        'message': 'successful', 
        'percentage_week': week_percentage,
        'week_planned': True,
        'total_time': goal_time_total,
        'time_spend_today': time_spend_today,
        'time_spend_week': goal_time_week
        })