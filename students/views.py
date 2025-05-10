# students/views.py
from datetime import date
from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import StudentSignUpForm
from .models import StudentProfile
from .forms import DocumentUploadForm

from django.contrib.auth.decorators import login_required


from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count
from django.shortcuts import render
from .models import StudentProfile, TeacherProfile, Course, Enrollment

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from django.http import FileResponse, Http404
from .models import Grade, Attendance, Submission, AcademicDocument, Assignment
from .forms import SubmissionForm,CourseForm

from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from .models import Course, StudentProfile, Attendance, Grade, Assignment, CourseResource, Message
from .forms import AttendanceFormSet, GradeFormSet, ResourceUploadForm, MessageForm
from weasyprint import HTML  # pip install weasyprint

from django.template.loader import render_to_string

from django.http import HttpResponse



@login_required
def report_card(request):
    student = request.user.studentprofile
    grades  = Grade.objects.filter(student=student).select_related('course')
    context = {
        'student': student,
        'grades': grades,
    }
    html_string = render_to_string('students/report_card.html', context)
    html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
    pdf  = html.write_pdf()

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Report_{student.user.username}.pdf"'
    return response

def signup(request):
    if request.method == 'POST':
        form = StudentSignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            # create profile
            StudentProfile.objects.create(user=user)
            login(request, user)
            return redirect('students:dashboard')
    else:
        form = StudentSignUpForm()
    return render(request, 'students/signup.html', {'form': form})





def upload_doc(request):
    if request.method == 'POST':
        form = DocumentUploadForm(request.POST, request.FILES)
        if form.is_valid():
            doc = form.save(commit=False)
            doc.student = request.user.studentprofile
            doc.save()
            return redirect('students:documents')
    else:
        form = DocumentUploadForm()
    return render(request, 'students/upload.html', {'form': form})


@login_required
def documents(request):
    docs = request.user.studentprofile.registrationdocument_set.all()
    return render(request, 'students/documents.html', {
        'documents': docs,
    })

# from django.contrib.auth.decorators import login_required
# from django.shortcuts import render

@login_required
def dashboard(request):
    profile   = request.user.studentprofile
    documents = profile.registrationdocument_set.all()
    return render(request, 'students/dashboard.html', {
        'profile': profile,
        'documents': documents,
    })








@staff_member_required
def admin_dashboard(request):
    total_students = StudentProfile.objects.count()
    total_teachers = TeacherProfile.objects.count()
    total_courses  = Course.objects.count()
    total_enroll   = Enrollment.objects.count()

    # Top 5 courses by enrollment
    popular = Course.objects.annotate(
        num_students=Count('enrollment')
    ).order_by('-num_students')[:5]

    return render(request, 'admin/dashboard.html', {
        'total_students': total_students,
        'total_teachers': total_teachers,
        'total_courses':  total_courses,
        'total_enroll':   total_enroll,
        'popular_courses': popular,
    })






@login_required
def profile(request):
    return render(request, 'students/profile.html', {
        'profile': request.user.studentprofile,
    })

@login_required
def view_grades(request):
    grades = Grade.objects.filter(student=request.user.studentprofile)
    return render(request, 'students/grades.html', {'grades': grades})

@login_required
def view_attendance(request):
    attendance = Attendance.objects.filter(student=request.user.studentprofile)
    return render(request, 'students/attendance.html', {'attendance': attendance})

@login_required
def submit_assignment(request):
    if request.method == 'POST':
        form = SubmissionForm(request.POST, request.FILES)
        if form.is_valid():
            submission = form.save(commit=False)
            submission.student = request.user.studentprofile
            submission.save()
            return redirect('students:submit')
    else:
        # limit assignments to those not yet submitted
        submitted = Submission.objects.filter(student=request.user.studentprofile)
        available = Assignment.objects.exclude(id__in=[s.assignment_id for s in submitted])
        form = SubmissionForm()
        form.fields['assignment'].queryset = available
    return render(request, 'students/submit_assignment.html', {'form': form})

@login_required
def academic_documents(request):
    docs = AcademicDocument.objects.filter(student=request.user.studentprofile)
    return render(request, 'students/docs.html', {'docs': docs})

@login_required
def download_doc(request, doc_id):
    doc = get_object_or_404(AcademicDocument, id=doc_id, student=request.user.studentprofile)
    try:
        return FileResponse(open(doc.file.path, 'rb'), as_attachment=True, filename=doc.title)
    except FileNotFoundError:
        raise Http404("Document not found.")





def is_teacher(user):
    return user.groups.filter(name='Teacher').exists()

@login_required
@user_passes_test(is_teacher)
def teacher_dashboard(request):
    profile    = request.user.teacherprofile
    courses    = profile.courses.all()
    return render(request, 'students/teacher/dashboard.html', {'courses': courses})

@login_required
@user_passes_test(is_teacher)
def manage_attendance(request, course_id):
    course   = get_object_or_404(Course, id=course_id)
    students = StudentProfile.objects.filter(enrollment__course=course)
    qs       = Attendance.objects.filter(course=course, date=date.today())
    formset  = AttendanceFormSet(queryset=qs)

    if request.method == 'POST':
        formset = AttendanceFormSet(request.POST, queryset=qs)
        if formset.is_valid():
            instances = formset.save(commit=False)
            for inst in instances:
                inst.course = course
                inst.save()
            return redirect('students:teacher-dashboard')
    return render(request, 'students/teacher/manage_attendance.html', {
        'course': course, 'students': students, 'formset': formset
    })

@login_required
@user_passes_test(is_teacher)
def manage_marks(request, course_id):
    course   = get_object_or_404(Course, id=course_id)
    qs       = Grade.objects.filter(course=course)
    formset  = GradeFormSet(queryset=qs)

    if request.method == 'POST':
        formset = GradeFormSet(request.POST, queryset=qs)
        if formset.is_valid():
            instances = formset.save(commit=False)
            for inst in instances:
                inst.course = course
                inst.save()
            return redirect('students:teacher-dashboard')
    return render(request, 'students/teacher/manage_marks.html', {
        'course': course, 'formset': formset
    })

@login_required
@user_passes_test(is_teacher)
def upload_resource(request):
    if request.method == 'POST':
        form = ResourceUploadForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('students:teacher-dashboard')
    else:
        form = ResourceUploadForm()
    return render(request, 'students/teacher/upload_resource.html', {'form': form})

@login_required
@user_passes_test(is_teacher)
def compose_message(request):
    if request.method == 'POST':
        form = MessageForm(request.POST)
        if form.is_valid():
            msg = form.save(commit=False)
            msg.sender = request.user
            msg.save()
            return redirect('students:teacher-inbox')
    else:
        form = MessageForm()
    return render(request, 'students/teacher/compose_message.html', {'form': form})

@login_required
@user_passes_test(is_teacher)
def inbox(request):
    msgs = Message.objects.filter(recipient=request.user).order_by('-sent_on')
    return render(request, 'students/teacher/inbox.html', {'messages': msgs})




# students/views.py

from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from .models import ClassSchedule
from .forms import ScheduleForm
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator

@method_decorator(staff_member_required, name='dispatch')
class ScheduleList(ListView):
    model = ClassSchedule
    template_name = 'students/schedule/list.html'
    context_object_name = 'slots'

@method_decorator(staff_member_required, name='dispatch')
class ScheduleCreate(CreateView):
    model = ClassSchedule
    form_class = ScheduleForm
    template_name = 'students/schedule/form.html'
    success_url = reverse_lazy('students:schedule-list')

@method_decorator(staff_member_required, name='dispatch')
class ScheduleUpdate(UpdateView):
    model = ClassSchedule
    form_class = ScheduleForm
    template_name = 'students/schedule/form.html'
    success_url = reverse_lazy('students:schedule-list')

@method_decorator(staff_member_required, name='dispatch')
class ScheduleDelete(DeleteView):
    model = ClassSchedule
    template_name = 'students/schedule/confirm_delete.html'
    success_url = reverse_lazy('students:schedule-list')



from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, DeleteView

# reuse the is_teacher test from before
from django.utils.decorators import method_decorator
from django.contrib.admin.views.decorators import staff_member_required, user_passes_test

def is_teacher(user):
    return user.groups.filter(name='Teacher').exists()

@method_decorator(user_passes_test(is_teacher), name='dispatch')
class TeacherCourseList(ListView):
    model = Course
    template_name = 'students/teacher/course_list.html'
    context_object_name = 'courses'

    def get_queryset(self):
        # only the courses where this teacher is assigned
        profile = self.request.user.teacherprofile
        return profile.courses.all()

@method_decorator(user_passes_test(is_teacher), name='dispatch')
class TeacherCourseCreate(CreateView):
    model = Course
    form_class = CourseForm
    template_name = 'students/teacher/course_form.html'
    success_url = reverse_lazy('students:teacher-courses')

    def form_valid(self, form):
        response = super().form_valid(form)
        # assign this teacher to the new course
        self.request.user.teacherprofile.courses.add(self.object)
        return response

@method_decorator(user_passes_test(is_teacher), name='dispatch')
class TeacherCourseUpdate(UpdateView):
    model = Course
    form_class = CourseForm
    template_name = 'students/teacher/course_form.html'
    success_url = reverse_lazy('students:teacher-courses')

    def get_queryset(self):
        # only allow editing courses the teacher teaches
        return self.request.user.teacherprofile.courses.all()

@method_decorator(user_passes_test(is_teacher), name='dispatch')
class TeacherCourseDelete(DeleteView):
    model = Course
    template_name = 'students/teacher/course_confirm_delete.html'
    success_url = reverse_lazy('students:teacher-courses')

    def get_queryset(self):
        return self.request.user.teacherprofile.courses.all()
