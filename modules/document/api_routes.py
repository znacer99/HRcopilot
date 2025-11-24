from flask import Blueprint, jsonify, request, send_file
from core.extensions import db
from core.models import Folder, UserDocument, EmployeeDocument, User
from modules.auth.jwt_utils import mobile_auth_required
from datetime import datetime
import os

api_document_bp = Blueprint('api_document', __name__, url_prefix='/api/documents')

# Helper to get the current user from JWT
def get_current_user():
    user_id = getattr(request, "user_id", None)
    if not user_id:
        return None
    return User.query.get(user_id)

# -----------------------------
# FOLDERS
# -----------------------------
@api_document_bp.route('/folders', methods=['GET'])
@mobile_auth_required
def get_folders():
    try:
        user = get_current_user()
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
        data = request.json

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
        docs = UserDocument.visible_documents_for(user)

        return jsonify({
            'success': True,
            'documents': [{
                'id': doc.id,
                'filename': doc.filename,
                'document_type': doc.document_type,
                'visibility_type': doc.visibility_type,
                'uploaded_at': doc.uploaded_at.isoformat(),
                'folder': {
                    'id': doc.folder.id,
                    'name': doc.folder.name
                } if doc.folder else None
            } for doc in docs]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500



@api_document_bp.route('/user/<int:id>/download', methods=['GET'])
@mobile_auth_required
def download_user_document(id):
    try:
        user = get_current_user()
        doc = UserDocument.query.get_or_404(id)

        if not doc.can_owner_access(user):
            return jsonify({'success': False, 'message': 'Access denied'}), 403

        return send_file(doc.filepath, as_attachment=True, download_name=doc.filename)

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# -----------------------------
# EMPLOYEE DOCUMENTS
# -----------------------------
@api_document_bp.route('/employee/<int:employee_id>', methods=['GET'])
@mobile_auth_required
def get_employee_documents(employee_id):
    try:
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
        doc = EmployeeDocument.query.get_or_404(id)
        return send_file(doc.filepath, as_attachment=True, download_name=doc.filename)

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
