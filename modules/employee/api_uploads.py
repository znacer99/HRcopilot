from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from core.extensions import db
from core.models import Employee
from modules.auth.jwt_utils import mobile_auth_required
import os

api_employee_upload_bp = Blueprint(
    "api_employee_upload",
    __name__,
    url_prefix="/api/employees"
)

UPLOAD_FOLDER = "instance/uploads/documents/employees"
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}


def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@api_employee_upload_bp.route("/<int:emp_id>/upload", methods=["POST"])
@mobile_auth_required
def upload_documents(emp_id):
    emp = Employee.query.get_or_404(emp_id)

    if "files" not in request.files:
        return jsonify({"success": False, "message": "No files part"}), 400

    files = request.files.getlist("files")

    saved_files = []

    # create employee folder if not exists
    emp_folder = os.path.join(UPLOAD_FOLDER, str(emp_id))
    os.makedirs(emp_folder, exist_ok=True)

    for file in files:
        if file and allowed(file.filename):
            filename = secure_filename(file.filename)
            save_path = os.path.join(emp_folder, filename)
            file.save(save_path)

            saved_files.append(filename)

    return jsonify({
        "success": True,
        "message": "Files uploaded successfully",
        "files": saved_files
    }), 200

