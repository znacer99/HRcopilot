from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from core.models import Candidate, Department
from modules.candidate.services import candidate_services

candidate_bp = Blueprint("candidates", __name__, url_prefix="/candidates")


# ---------------- DASHBOARD ROUTES ---------------- #

@candidate_bp.route("/")
@login_required
def list_candidates():
    candidates = Candidate.query.order_by(Candidate.created_at.desc()).all()
    return render_template("dashboard/candidates/list.html", candidates=candidates)


@candidate_bp.route("/create", methods=["GET", "POST"])
@login_required
def create_candidate():
    departments = Department.query.all()
    if request.method == "POST":
        cv_file = request.files.get("cv")
        id_file = request.files.get("id_document")
        candidate_services.save_candidate(request.form, cv_file=cv_file, id_file=id_file)
        flash("Candidate created successfully.", "success")
        return redirect(url_for("candidates.list_candidates"))
    return render_template("dashboard/candidates/form.html", candidate=None, departments=departments)


@candidate_bp.route("/edit/<int:id>", methods=["GET", "POST"])
@login_required
def edit_candidate(id):
    candidate = Candidate.query.get_or_404(id)
    departments = Department.query.all()
    if request.method == "POST":
        cv_file = request.files.get("cv")
        id_file = request.files.get("id_document")
        candidate_services.update_candidate(id, request.form, cv_file=cv_file, id_file=id_file)
        flash("Candidate updated successfully.", "success")
        return redirect(url_for("candidates.list_candidates"))
    return render_template("dashboard/candidates/form.html", candidate=candidate, departments=departments)


@candidate_bp.route("/delete/<int:id>", methods=["POST"])
@login_required
def delete_candidate(id):
    candidate_services.delete_candidate(id)
    flash("Candidate deleted successfully.", "success")
    return redirect(url_for("candidates.list_candidates"))


# ---------------- PUBLIC ROUTES ---------------- #

@candidate_bp.route("/apply", methods=["POST"])
def public_apply():
    cv_file = request.files.get("resume")
    id_file = request.files.get("id_document")

    candidate_services.save_candidate(
        request.form,
        cv_file=cv_file,
        id_file=id_file
    )

    flash("Application submitted successfully.", "success")
    return redirect(url_for("landing.landing"))