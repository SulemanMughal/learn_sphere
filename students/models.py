from django.contrib.auth.models import User
from django.db import models

# from django.db import models
from django.utils.translation import gettext_lazy as _
# from .models import Course, TeacherProfile

class StudentProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE)
    enrolled_on = models.DateTimeField(auto_now_add=True)
    # other fields...

class RegistrationDocument(models.Model):
    student   = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    doc_title = models.CharField(max_length=100)
    file      = models.FileField(upload_to='documents/%Y/%m/%d/')
    uploaded  = models.DateTimeField(auto_now_add=True)




class TeacherProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE)
    hire_date   = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Course(models.Model):
    code        = models.CharField(max_length=10, unique=True)
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    teachers    = models.ManyToManyField(TeacherProfile, related_name='courses')

    def __str__(self):
        return f"{self.code} – {self.name}"

class Enrollment(models.Model):
    student     = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    course      = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_on = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')




class Grade(models.Model):
    student     = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    course      = models.ForeignKey(Course, on_delete=models.CASCADE)
    grade       = models.CharField(max_length=5)       # e.g. 'A', 'B+', '75%'
    date_added  = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} – {self.course}: {self.grade}"
    


class ClassSchedule(models.Model):
    class Weekday(models.TextChoices):
        MONDAY    = 'MO', _('Monday')
        TUESDAY   = 'TU', _('Tuesday')
        WEDNESDAY = 'WE', _('Wednesday')
        THURSDAY  = 'TH', _('Thursday')
        FRIDAY    = 'FR', _('Friday')
        SATURDAY  = 'SA', _('Saturday')
        SUNDAY    = 'SU', _('Sunday')

    course     = models.ForeignKey(Course, on_delete=models.CASCADE)
    teacher    = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE)
    day        = models.CharField(max_length=2, choices=Weekday.choices)
    start_time = models.TimeField()
    end_time   = models.TimeField()
    venue      = models.CharField(max_length=100, blank=True)

    class Meta:
        unique_together = ('course', 'day', 'start_time')
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"{self.course.code} on {self.get_day_display()} at {self.start_time}"


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('P', 'Present'),
        ('A', 'Absent'),
        ('L', 'Late'),
    ]
    student     = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    course      = models.ForeignKey(Course, on_delete=models.CASCADE)
    date        = models.DateField()
    status      = models.CharField(max_length=1, choices=STATUS_CHOICES)
    schedule = models.ForeignKey(ClassSchedule, on_delete=models.SET_NULL, null=True, blank=True)


    class Meta:
        unique_together = ('student', 'course', 'date')

    def __str__(self):
        return f"{self.student} – {self.date}: {self.get_status_display()}"

class Assignment(models.Model):
    course      = models.ForeignKey(Course, on_delete=models.CASCADE)
    title       = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    due_date    = models.DateField()

    def __str__(self):
        return f"{self.course.code} – {self.title}"

class Submission(models.Model):
    assignment  = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    student     = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    file        = models.FileField(upload_to='submissions/%Y/%m/%d/')
    submitted   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student} – {self.assignment.title}"

class AcademicDocument(models.Model):
    student     = models.ForeignKey('StudentProfile', on_delete=models.CASCADE)
    title       = models.CharField(max_length=100)
    file        = models.FileField(upload_to='academic_docs/%Y/%m/%d/')
    uploaded    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} – {self.title}"




class CourseResource(models.Model):
    course      = models.ForeignKey(Course, on_delete=models.CASCADE)
    title       = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    file        = models.FileField(upload_to='resources/%Y/%m/%d/')
    uploaded    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.code} – {self.title}"

class Message(models.Model):
    sender      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    subject     = models.CharField(max_length=150)
    body        = models.TextField()
    sent_on     = models.DateTimeField(auto_now_add=True)
    read        = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject} from {self.sender.username}"


# students/models.py


