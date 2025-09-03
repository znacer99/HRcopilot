import os
from datetime import datetime
from flask import current_app
from werkzeug.utils import secure_filename
from core.extensions import db
from core.models import Candidate

def save_candidate(form_data, file=None):
    candidate = Candidate(
        name=form_data.get("name"),
        email=form_data.get("email"),
        phone=form_data.get("phone"),
        position_applied=form_data.get("position_applied"),
        status=form_data.get("status") or "Pending",
    )

    if file:
        filename = secure_filename(file.filename)
        folder = os.path.join(current_app.config['UPLOAD_FOLDER'], "candidates")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        file.save(path)
        candidate.resume_path = os.path.relpath(path, current_app.config['UPLOAD_FOLDER'])

    db.session.add(candidate)
    db.session.commit()
    return candidate

def update_candidate(candidate_id, form_data, file=None):
    candidate = Candidate.query.get_or_404(candidate_id)
    candidate.name = form_data.get("name", candidate.name)
    candidate.email = form_data.get("email", candidate.email)
    candidate.phone = form_data.get("phone", candidate.phone)
    candidate.position_applied = form_data.get("position_applied", candidate.position_applied)
    candidate.status = form_data.get("status", candidate.status)

    if file:
        filename = secure_filename(file.filename)
        folder = os.path.join(current_app.config['UPLOAD_FOLDER'], "candidates")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        file.save(path)
        candidate.resume_path = os.path.relpath(path, current_app.config['UPLOAD_FOLDER'])

    db.session.commit()
    return candidate

def delete_candidate(candidate_id):
    candidate = Candidate.query.get_or_404(candidate_id)
    # Delete resume file if exists
    if candidate.resume_path:
        abs_path = os.path.join(current_app.config['UPLOAD_FOLDER'], candidate.resume_path)
        if os.path.exists(abs_path):
            os.remove(abs_path)
    db.session.delete(candidate)
    db.session.commit()
    return True


# === Wrap functions in a service object ===
class CandidateService:
    save_candidate = staticmethod(save_candidate)
    update_candidate = staticmethod(update_candidate)
    delete_candidate = staticmethod(delete_candidate)

# This is what routes.py imports
candidate_services = CandidateService()
