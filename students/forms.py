from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import StudentProfile, RegistrationDocument
from django.contrib.auth.models import User
from .models import ClassSchedule

# from django import forms
from django.forms.models import modelformset_factory
from .models import Attendance, Grade, CourseResource, Message, Assignment


# from django import forms
from .models import Course, TeacherProfile

class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['code', 'name', 'description']


class StudentSignUpForm(UserCreationForm):
    email = forms.EmailField(required=True)
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ['username', 'email', 'password1', 'password2']

class DocumentUploadForm(forms.ModelForm):
    class Meta:
        model = RegistrationDocument
        fields = ['doc_title', 'file']


# from django import forms
from .models import Submission

class SubmissionForm(forms.ModelForm):
    class Meta:
        model = Submission
        fields = ['assignment', 'file']





# For bulk attendance marking
AttendanceFormSet = modelformset_factory(
    Attendance,
    fields=('status',),
    extra=0
)

# For bulk grade entry/edit
GradeFormSet = modelformset_factory(
    Grade,
    fields=('grade',),
    extra=0
)

class ResourceUploadForm(forms.ModelForm):
    class Meta:
        model = CourseResource
        fields = ['course', 'title', 'description', 'file']

class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['recipient', 'subject', 'body']
        widgets = {
            'body': forms.Textarea(attrs={'rows':4}),
        }



# students/forms.py

# from django import forms


class ScheduleForm(forms.ModelForm):
    class Meta:
        model = ClassSchedule
        fields = ['course','teacher','day','start_time','end_time','venue']
        widgets = {
            'day': forms.Select(),
            'start_time': forms.TimeInput(format='%H:%M'),
            'end_time':   forms.TimeInput(format='%H:%M'),
        }
