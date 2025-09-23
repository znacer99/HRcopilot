import os
from flask import current_app
from werkzeug.utils import secure_filename
from core.extensions import db
from core.models import Candidate

# -------------------- Helper -------------------- #
def save_file(file_obj, subfolder="candidates"):
    """Save uploaded file to static/subfolder and return relative path for template"""
    if not file_obj:
        return None

    folder = os.path.join(current_app.root_path, "static", subfolder)
    os.makedirs(folder, exist_ok=True)

    filename = secure_filename(file_obj.filename)
    path = os.path.join(folder, filename)
    file_obj.save(path)

    # Return relative path from static folder
    return f"{subfolder}/{filename}"


# -------------------- CRUD -------------------- #
def save_candidate(form_data, cv_file=None, id_file=None):
    candidate = Candidate(
        full_name=form_data.get("full_name"),
        email=form_data.get("email"),
        phone=form_data.get("phone"),
        nationality=form_data.get("nationality"),
        applied_position=form_data.get("applied_position"),
        department_id=form_data.get("department_id"),
        status=form_data.get("status") or "new",
    )

    candidate.cv_filepath = save_file(cv_file)
    candidate.id_document_filepath = save_file(id_file)

    db.session.add(candidate)
    db.session.commit()
    return candidate


def update_candidate(candidate_id, form_data, cv_file=None, id_file=None):
    candidate = Candidate.query.get_or_404(candidate_id)
    candidate.full_name = form_data.get("full_name", candidate.full_name)
    candidate.email = form_data.get("email", candidate.email)
    candidate.phone = form_data.get("phone", candidate.phone)
    candidate.nationality = form_data.get("nationality", candidate.nationality)
    candidate.applied_position = form_data.get("applied_position", candidate.applied_position)
    candidate.department_id = form_data.get("department_id", candidate.department_id)
    candidate.status = form_data.get("status", candidate.status)

    # Update files if new ones are uploaded
    if cv_file:
        candidate.cv_filepath = save_file(cv_file)
    if id_file:
        candidate.id_document_filepath = save_file(id_file)

    db.session.commit()
    return candidate


def delete_candidate(candidate_id):
    candidate = Candidate.query.get_or_404(candidate_id)

    # Delete files from static folder
    for file_attr in ["cv_filepath", "id_document_filepath"]:
        filepath = getattr(candidate, file_attr)
        if filepath:
            abs_path = os.path.join(current_app.root_path, "static", filepath)
            if os.path.exists(abs_path):
                os.remove(abs_path)

    db.session.delete(candidate)
    db.session.commit()
    return True


# -------------------- Service Object -------------------- #
class CandidateService:
    save_candidate = staticmethod(save_candidate)
    update_candidate = staticmethod(update_candidate)
    delete_candidate = staticmethod(delete_candidate)


candidate_services = CandidateService()
