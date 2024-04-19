# Generated by Django 4.2.5 on 2024-04-19 14:17

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('caption', models.CharField(max_length=100)),
                ('photo_or_video', models.ImageField(upload_to='events/')),
                ('date', models.DateTimeField()),
                ('reacts', models.IntegerField(default=0)),
                ('clicks', models.IntegerField(default=0)),
                ('views', models.IntegerField(default=0)),
                ('comments', models.IntegerField(default=0)),
                ('content_manager', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
