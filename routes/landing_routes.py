from flask import Blueprint, render_template, request
from config_data.specialties import SPECIALTIES

# Define blueprint
landing_bp = Blueprint('landing', __name__)

# Route for the landing page
@landing_bp.route('/')
def landing():
    submitted = request.args.get('submitted') # capture the query parameter
    return render_template('landing.html', specialties=SPECIALTIES, submitted=submitted)
