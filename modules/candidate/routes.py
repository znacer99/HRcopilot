from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from core.models import Candidate
from modules.candidate.services import candidate_services  # <- use the service object

candidate_bp = Blueprint("candidates", __name__, url_prefix="/candidates")


@candidate_bp.route("/")
@login_required
def list_candidates():
    candidates = Candidate.query.order_by(Candidate.created_at.desc()).all()
    return render_template("dashboard/candidates/list.html", candidates=candidates)


@candidate_bp.route("/create", methods=["GET", "POST"])
@login_required
def create_candidate():
    if request.method == "POST":
        file = request.files.get("resume")
        candidate_services.save_candidate(request.form, file=file)  # call via service object
        flash("Candidate created successfully.", "success")
        return redirect(url_for("candidates.list_candidates"))
    return render_template("dashboard/candidates/form.html", candidate=None)


@candidate_bp.route("/edit/<int:id>", methods=["GET", "POST"])
@login_required
def edit_candidate(id):
    candidate = Candidate.query.get_or_404(id)
    if request.method == "POST":
        file = request.files.get("resume")
        candidate_services.update_candidate(id, request.form, file=file)  # call via service object
        flash("Candidate updated successfully.", "success")
        return redirect(url_for("candidates.list_candidates"))
    return render_template("dashboard/candidates/form.html", candidate=candidate)


@candidate_bp.route("/delete/<int:id>", methods=["POST"])
@login_required
def delete_candidate(id):
    candidate_services.delete_candidate(id)  # call via service object
    flash("Candidate deleted successfully.", "success")
    return redirect(url_for("candidates.list_candidates"))
