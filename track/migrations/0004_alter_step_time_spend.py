# Generated by Django 5.0.6 on 2024-09-18 05:08

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('track', '0003_alter_step_time_spend'),
    ]

    operations = [
        migrations.AlterField(
            model_name='step',
            name='time_spend',
            field=models.DurationField(blank=True, default=datetime.timedelta(0), null=True),
        ),
    ]
