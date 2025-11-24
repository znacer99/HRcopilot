from flask import Blueprint, jsonify, request, send_file
from flask_login import login_required, current_user
from core.extensions import db
from core.models import Folder, UserDocument, EmployeeDocument
from werkzeug.utils import secure_filename
import os
from datetime import datetime

api_document_bp = Blueprint('api_document', __name__, url_prefix='/api/documents')

# Folders
@api_document_bp.route('/folders', methods=['GET'])
@login_required
def get_folders():
    try:
        folders = Folder.query.filter_by(created_by=current_user.id).all()
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
@login_required
def create_folder():
    try:
        data = request.json
        folder = Folder(
            name=data.get('name'),
            created_by=current_user.id
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

# User Documents
@api_document_bp.route('/user', methods=['GET'])
@login_required
def get_user_documents():
    try:
        docs = UserDocument.visible_documents_for(current_user)
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
@login_required
def download_user_document(id):
    try:
        doc = UserDocument.query.get_or_404(id)
        if not doc.can_owner_access(current_user):
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        return send_file(doc.filepath, as_attachment=True, download_name=doc.filename)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Employee Documents
@api_document_bp.route('/employee/<int:employee_id>', methods=['GET'])
@login_required
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
@login_required
def download_employee_document(id):
    try:
        doc = EmployeeDocument.query.get_or_404(id)
        return send_file(doc.filepath, as_attachment=True, download_name=doc.filename)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
