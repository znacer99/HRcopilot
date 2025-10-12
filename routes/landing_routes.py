from flask import Blueprint, render_template
from config_data.specialties import SPECIALTIES

# Define blueprint
landing_bp = Blueprint('landing', __name__)

# Route for the landing page
@landing_bp.route('/')
def landing():
    return render_template('landing.html', specialties=SPECIALTIES)