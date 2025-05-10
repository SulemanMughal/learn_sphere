from django.contrib import admin
from .models import StudentProfile, TeacherProfile, Course, Enrollment, Message

@admin.register(StudentProfile)
class StudentAdmin(admin.ModelAdmin):
    list_display   = ('user', 'enrolled_on')
    # list_filter    = ('is_enrolled',)
    search_fields  = ('user__username','user__email')

@admin.register(TeacherProfile)
class TeacherAdmin(admin.ModelAdmin):
    list_display  = ('user','hire_date')
    search_fields = ('user__username','user__email')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display   = ('code','name')
    search_fields  = ('code','name')
    filter_horizontal = ('teachers',)

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = ('student','course','enrolled_on')
    list_filter   = ('enrolled_on',)
    search_fields = ('student__user__username','course__code')



from .models import ClassSchedule

@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display    = ('course','teacher','day','start_time','end_time','venue')
    list_filter     = ('day','teacher')
    search_fields   = ('course__code','teacher__user__username')



admin.site.register(Message)