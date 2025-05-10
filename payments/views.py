import stripe
from django.conf import settings
from django.shortcuts import redirect

from django.shortcuts import render


stripe.api_key = settings.STRIPE_SECRET_KEY

def create_checkout(request):
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': 'Enrollment Fee'},
                'unit_amount': 5000,  # $50.00
            },
            'quantity': 1,
        }],
        mode='payment',
        success_url=request.build_absolute_uri('/payments/success/'),
        cancel_url=request.build_absolute_uri('/payments/cancel/'),
    )
    return redirect(session.url, code=303)




def payment_success(request):
    # You might look up the session or student here to confirm
    return render(request, 'payments/success.html')

def payment_cancel(request):
    return render(request, 'payments/cancel.html')
