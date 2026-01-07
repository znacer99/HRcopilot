from flask import Blueprint, jsonify, request, send_file
from core.extensions import db
from core.models import Folder, UserDocument, EmployeeDocument, User, Employee
from modules.auth.jwt_utils import mobile_auth_required
import os

api_document_bp = Blueprint('api_document', __name__, url_prefix='/api/documents')

PRIVILEGED_ROLES = {"general_director", "it_manager"}


# Helper to get the current user from JWT
def get_current_user():
    user_id = getattr(request, "user_id", None)
    if not user_id:
        return None
    return User.query.get(user_id)


def is_privileged(user):
    if not user or not getattr(user, "role", None):
        return False
    return user.role.strip().lower() in PRIVILEGED_ROLES


def get_employee_for_user(user_id: int):
    if not user_id:
        return None
    return Employee.query.filter_by(user_id=user_id).first()


def can_access_employee_docs(user, employee_id: int) -> bool:
    if is_privileged(user):
        return True
    emp = get_employee_for_user(getattr(user, "id", None))
    return bool(emp and emp.id == employee_id)


def can_access_employee_doc(user, doc: EmployeeDocument) -> bool:
    if is_privileged(user):
        return True
    emp = Employee.query.get(getattr(doc, "employee_id", None))
    return bool(emp and emp.user_id == getattr(user, "id", None))


# -----------------------------
# FOLDERS
# -----------------------------
@api_document_bp.route('/folders', methods=['GET'])
@mobile_auth_required
def get_folders():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        folders = Folder.query.filter_by(created_by=user.id).all()

        return jsonify({
            'success': True,
            'folders': [{
                'id': f.id,
                'name': f.name,
                'created_at': f.created_at.isoformat(),
                'document_count': len(f.documents)
            } for f in folders]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_document_bp.route('/folders', methods=['POST'])
@mobile_auth_required
def create_folder():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        data = request.json or {}

        folder = Folder(
            name=data.get('name'),
            created_by=user.id
        )

        db.session.add(folder)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Folder created',
            'folder_id': folder.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# -----------------------------
# USER DOCUMENTS
# -----------------------------
@api_document_bp.route('/user', methods=['GET'])
@mobile_auth_required
def get_user_documents():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        # 1. Fetch UserDocument entries (owned directly by user)
        user_docs = UserDocument.visible_documents_for(user)
        result = [{
            'id': doc.id,
            'source': 'user',
            'filename': doc.filename,
            'document_type': doc.document_type,
            'visibility_type': doc.visibility_type,
            'uploaded_at': doc.uploaded_at.isoformat(),
            'folder': {
                'id': doc.folder.id,
                'name': doc.folder.name
            } if doc.folder else None
        } for doc in user_docs]

        # 2. Fetch EmployeeDocument entries (linked to the employee profile)
        emp = Employee.query.filter_by(user_id=user.id).first()
        if emp:
            emp_docs = EmployeeDocument.query.filter_by(employee_id=emp.id).all()
            result.extend([{
                'id': edoc.id,
                'source': 'employee',
                'filename': edoc.filename,
                'document_type': edoc.document_type,
                'visibility_type': edoc.visibility_type,
                'uploaded_at': edoc.uploaded_at.isoformat(),
                'folder': None
            } for edoc in emp_docs])

        return jsonify({
            'success': True,
            'documents': result
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_document_bp.route('/user/<int:id>/download', methods=['GET'])
@mobile_auth_required
def download_user_document(id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        doc = UserDocument.query.get_or_404(id)

        if not doc.can_owner_access(user):
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        abs_path = os.path.abspath(doc.filepath)
        if not os.path.exists(abs_path):
            print(f"❌ DOWNLOAD FAIL - FILE NOT FOUND: {abs_path}")
            return jsonify({'success': False, 'message': 'File not found on server'}), 404
            
        file_size = os.path.getsize(abs_path)
        print(f"📄 DOWNLOADING USER DOC: {abs_path} (Size: {file_size} bytes)")
            
        with open(abs_path, 'rb') as f:
            file_data = f.read()
            
        from flask import make_response
        response = make_response(file_data)
        response.headers['Content-Type'] = 'application/pdf'
        
        # Support inline viewing vs download
        is_inline = request.args.get('inline') == '1'
        disp = 'inline' if is_inline else 'attachment'
        
        response.headers['Content-Disposition'] = f'{disp}; filename="{doc.filename}"'
        response.headers['Content-Length'] = str(len(file_data))
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# -----------------------------
# EMPLOYEE DOCUMENTS
# -----------------------------
@api_document_bp.route('/employee/<int:employee_id>', methods=['GET'])
@mobile_auth_required
def get_employee_documents(employee_id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        if not can_access_employee_docs(user, employee_id):
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        docs = EmployeeDocument.query.filter_by(employee_id=employee_id).all()

        return jsonify({
            'success': True,
            'documents': [{
                'id': doc.id,
                'filename': doc.filename,
                'document_type': doc.document_type,
                'visibility_type': doc.visibility_type,
                'uploaded_at': doc.uploaded_at.isoformat()
            } for doc in docs]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_document_bp.route('/employee/<int:id>/download', methods=['GET'])
@mobile_auth_required
def download_employee_document(id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        doc = EmployeeDocument.query.get_or_404(id)

        if not can_access_employee_doc(user, doc):
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        abs_path = os.path.abspath(doc.filepath)
        if not os.path.exists(abs_path):
            print(f"❌ DOWNLOAD FAIL - FILE NOT FOUND: {abs_path}")
            return jsonify({'success': False, 'message': 'File not found on server'}), 404

        file_size = os.path.getsize(abs_path)
        print(f"📄 DOWNLOADING EMPLOYEE DOC: {abs_path} (Size: {file_size} bytes)")

        with open(abs_path, 'rb') as f:
            file_data = f.read()
            
        from flask import make_response
        response = make_response(file_data)
        response.headers['Content-Type'] = 'application/pdf'
        
        # Support inline viewing vs download
        is_inline = request.args.get('inline') == '1'
        disp = 'inline' if is_inline else 'attachment'

        response.headers['Content-Disposition'] = f'{disp}; filename="{doc.filename}"'
        response.headers['Content-Length'] = str(len(file_data))
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_document_bp.route('/employee/<int:doc_id>', methods=['DELETE'])
@mobile_auth_required
def delete_employee_document(doc_id):
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        if not is_privileged(user):
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        doc = EmployeeDocument.query.get_or_404(doc_id)
        filepath = doc.filepath

        db.session.delete(doc)
        db.session.commit()

        # Delete file safely (missing file must not crash)
        try:
            if filepath:
                abs_path = os.path.abspath(filepath)
                if os.path.exists(abs_path) and os.path.isfile(abs_path):
                    os.remove(abs_path)
        except Exception:
            pass

        return jsonify({'success': True, 'message': 'Document deleted'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
