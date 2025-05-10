# students/urls.py
from django.urls import path
from . import views

app_name = 'students'


urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('upload/', views.upload_doc, name='upload'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('documents/', views.documents, name='documents'),
    path('profile/',        views.profile,             name='profile'),
    path('grades/',         views.view_grades,         name='grades'),
    path('attendance/',     views.view_attendance,     name='attendance'),
    path('submit/',         views.submit_assignment,   name='submit'),
    path('docs/',           views.academic_documents,   name='docs'),
    path('download/<int:doc_id>/', views.download_doc,  name='download_doc'),

    # Teacher module
    path('teacher/dashboard/',           views.teacher_dashboard,     name='teacher-dashboard'),
    path('teacher/attendance/<int:course_id>/', views.manage_attendance,  name='manage-attendance'),
    path('teacher/marks/<int:course_id>/',      views.manage_marks,       name='manage-marks'),
    path('teacher/upload-resource/',     views.upload_resource,       name='upload-resource'),
    path('teacher/compose/',             views.compose_message,       name='teacher-compose'),
    path('teacher/inbox/',               views.inbox,                 name='teacher-inbox'),


    # Scheduling
    path('schedule/',        views.ScheduleList.as_view(),   name='schedule-list'),
    path('schedule/add/',    views.ScheduleCreate.as_view(), name='schedule-add'),
    path('schedule/<int:pk>/edit/', views.ScheduleUpdate.as_view(), name='schedule-edit'),
    path('schedule/<int:pk>/delete/', views.ScheduleDelete.as_view(), name='schedule-delete'),

    path('report-card/', views.report_card, name='report-card'),


    # Teacher Course Management
    path('teacher/courses/',             views.TeacherCourseList.as_view(),   name='teacher-courses'),
    path('teacher/courses/add/',         views.TeacherCourseCreate.as_view(), name='teacher-course-add'),
    path('teacher/courses/<int:pk>/edit/',   views.TeacherCourseUpdate.as_view(), name='teacher-course-edit'),
    path('teacher/courses/<int:pk>/delete/', views.TeacherCourseDelete.as_view(), name='teacher-course-delete'),



    # ...
]
