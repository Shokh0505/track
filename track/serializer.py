from rest_framework import serializers
from .models import Goal, User, Step

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']

class GoalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Goal
        fields = ['user', 'title', 'id']

class StepSerializer(serializers.ModelSerializer):
    goal = GoalSerializer(read_only=True)

    class Meta:
        model = Step
        fields = ['goal', 'step_title', 'total_time_spend', 'id']