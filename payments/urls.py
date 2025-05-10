from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    path('checkout/', views.create_checkout, name='checkout'),
    path('success/',  views.payment_success, name='success'),
    path('cancel/',   views.payment_cancel,  name='cancel'),
]
