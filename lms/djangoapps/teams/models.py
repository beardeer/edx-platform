"""
Django models related to teams functionality.
"""

from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import ugettext_lazy
from django.conf import settings
from django_countries.fields import CountryField
from .utils import slugify

from xmodule_django.models import CourseKeyField


class CourseTeam(models.Model):
    """
    This model represents team related info.
    """

    team_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    course_id = CourseKeyField(max_length=255, db_index=True)
    topic_id = models.CharField(max_length=255, db_index=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    # last_activity is computed through a query
    description = models.CharField(max_length=300)
    country = CountryField(blank=True)
    language = models.CharField(
        max_length=16,
        blank=True,
        choices=settings.ALL_LANGUAGES,
        help_text=ugettext_lazy("Optional language the team uses as ISO 639-1 code.")
    )
    users = models.ManyToManyField(User, db_index=True, related_name='teams', through='CourseTeamMembership')

    @classmethod
    def create(cls, name, course_id, description, topic_id=None, country=None, language=None):
        """Create a complete CourseTeam object.

        Args:
            name (str): The name of the team to be created.
            course_id (str): The ID string of the course associated
              with this team.
            description (str): A description of the team.
            topic_id (str): An optional identifier for the topic the
              team formed around.
            country (str or None): An optional country where the team
              is based, as ISO 3166-1 code.
            language (str or None): An optional language which the 
              team uses, as ISO 639-1 code.

        """

        team_id = slugify(name)
        conflicts = cls.objects.filter(team_id__startswith=team_id).values_list('team_id', flat=True)

        if conflicts and team_id in conflicts:
            suffix = 2
            while True:
                new_id = team_id + '-' + str(suffix)
                if new_id not in conflicts:
                    team_id = new_id
                    break
                suffix += 1

        course_team = cls(
            team_id=team_id,
            name=name,
            course_id=course_id,
            topic_id=topic_id if topic_id else '',
            description=description,
            country=country if country else '',
            language=language if language else '',
        )

        return course_team

    def add_user(self, user):
        """
        Adds the given user to the CourseTeam
        """
        CourseTeamMembership.objects.get_or_create(
            user=user,
            team=self
        )


class CourseTeamMembership(models.Model):
    """
    This model represents the membership of a single user in a single team.
    """

    class Meta(object):
        """
        Stores meta information for the model.
        """
        unique_together = (('user', 'team'),)

    user = models.ForeignKey(User)
    team = models.ForeignKey(CourseTeam, related_name='membership')
    date_joined = models.DateTimeField(auto_now_add=True)
