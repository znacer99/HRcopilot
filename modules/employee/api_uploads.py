from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
from core.extensions import db
from core.models import Employee, EmployeeDocument
from modules.auth.jwt_utils import mobile_auth_required
import os
from datetime import datetime

api_employee_upload_bp = Blueprint(
    "api_employee_upload",
    __name__,
    url_prefix="/api/employees"
)

# Use absolute path or relative to app root
UPLOAD_FOLDER = os.path.join("static", "uploads", "documents", "employees")
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}


def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@api_employee_upload_bp.route("/<int:emp_id>/upload", methods=["POST"])
@mobile_auth_required
def upload_documents(emp_id):
    print(f"📥 RECEIVED UPLOAD REQUEST for emp_id: {emp_id}")
    try:
        emp = Employee.query.get_or_404(emp_id)
        print(f"👤 EMPLOYEE FOUND: {emp.full_name}")

        if "file" not in request.files:
            print("❌ NO FILE PART")
            return jsonify({"success": False, "message": "No file part in request"}), 400
            
        f = request.files["file"]
        print(f"📄 FILENAME: {f.filename}")
        title = request.form.get("title")
        doc_type = request.form.get("type", "additional")
        visibility = request.form.get("visibility", "private")

        if not f or f.filename == "":
            return jsonify({"success": False, "message": "No selected file"}), 400
            
        if not allowed(f.filename):
            return jsonify({"success": False, "message": "File type not allowed"}), 400

        # Ensure directory exists
        emp_folder = os.path.join(UPLOAD_FOLDER, str(emp_id))
        os.makedirs(emp_folder, exist_ok=True)

        filename = secure_filename(f.filename)
        # Add timestamp to filename to avoid collisions
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        save_path = os.path.join(emp_folder, unique_filename)
        
        print(f"💾 SAVING TO: {save_path}")
        # Save file to disk
        f.save(save_path)
        print("✅ FILE SAVED TO DISK")

        # Preserve extension even if title is provided
        final_filename = title or filename
        ext = os.path.splitext(f.filename)[1]
        if ext and not final_filename.lower().endswith(ext.lower()):
            final_filename += ext

        # Create database record
        new_doc = EmployeeDocument(
            filename=final_filename,
            filepath=save_path, 
            employee_id=emp_id,
            document_type=doc_type,
            visibility_type=visibility
        )
        
        print("📝 SAVING TO DB...")
        db.session.add(new_doc)
        db.session.commit()
        print(f"✅ DB RECORD CREATED: {new_doc.id}")

        return jsonify({
            "success": True,
            "message": "Files uploaded successfully",
            "document_id": new_doc.id,
            "filename": unique_filename
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"UPLOAD ERROR: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500
