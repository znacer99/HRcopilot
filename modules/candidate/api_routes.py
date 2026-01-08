from flask import Blueprint, jsonify, request, send_file
from core.extensions import db
from core.models import Candidate, Department
from datetime import datetime
from modules.auth.jwt_utils import mobile_auth_required

api_candidate_bp = Blueprint('api_candidate', __name__, url_prefix='/api/candidates')

@api_candidate_bp.route('', methods=['GET'])
@mobile_auth_required
def get_candidates():
    try:
        candidates = Candidate.query.all()
        return jsonify({
            'success': True,
            'candidates': [{
                'id': c.id,
                'full_name': c.full_name,
                'email': c.email,
                'phone': c.phone,
                'nationality': c.nationality,
                'applied_position': c.applied_position,
                'specialty': c.specialty,
                'experience': c.experience,
                'education': c.education,
                'skills': c.skills,
                'status': c.status,
                'cv_filepath': c.cv_filepath,
                'id_document_filepath': c.id_document_filepath,
                'updated_at': c.updated_at.isoformat() if c.updated_at else None,
                'department': {
                    'id': c.department.id,
                    'name': c.department.name
                } if c.department else None,
                'created_at': c.created_at.isoformat()
            } for c in candidates]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@api_candidate_bp.route('/<int:id>', methods=['GET'])
@mobile_auth_required
def get_candidate(id):
    try:
        c = Candidate.query.get_or_404(id)
        return jsonify({
            'success': True,
            'candidate': {
                'id': c.id,
                'full_name': c.full_name,
                'email': c.email,
                'phone': c.phone,
                'nationality': c.nationality,
                'applied_position': c.applied_position,
                'specialty': c.specialty,
                'experience': c.experience,
                'education': c.education,
                'skills': c.skills,
                'status': c.status,
                'cv_filepath': c.cv_filepath,
                'id_document_filepath': c.id_document_filepath,
                'department': {
                    'id': c.department.id,
                    'name': c.department.name
                } if c.department else None,
                'created_at': c.created_at.isoformat(),
                'updated_at': c.updated_at.isoformat()
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_candidate_bp.route('/<int:id>/status', methods=['PUT'])
@mobile_auth_required
def update_status(id):
    try:
        c = Candidate.query.get_or_404(id)
        data = request.json
        c.status = data.get('status', c.status)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Status updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ------------------------------------------------------------
# CREATE A CANDIDATE
# ------------------------------------------------------------
@api_candidate_bp.route('', methods=['POST'])
@mobile_auth_required
def create_candidate():
    try:
        current_user = getattr(request, "user", None)
        if current_user.role.lower() not in ['it_manager', 'general_director', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        data = request.json
        
        # Basic validation
        if not data.get('full_name'):
            return jsonify({'success': False, 'message': 'Full name is required'}), 400

        new_candidate = Candidate(
            full_name=data['full_name'],
            email=data.get('email'),
            phone=data.get('phone'),
            nationality=data.get('nationality'),
            applied_position=data.get('applied_position'),
            specialty=data.get('specialty'),
            experience=data.get('experience'),
            education=data.get('education'),
            skills=data.get('skills'),
            status=data.get('status', 'new'),
            department_id=data.get('department_id'),
            id_document_filepath=data.get('id_document_filepath', '') # Require this or a placeholder
        )

        db.session.add(new_candidate)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Candidate created successfully',
            'candidate_id': new_candidate.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ------------------------------------------------------------
# UPDATE A CANDIDATE
# ------------------------------------------------------------
@api_candidate_bp.route('/<int:id>', methods=['PUT'])
@mobile_auth_required
def update_candidate(id):
    try:
        current_user = getattr(request, "user", None)
        if current_user.role.lower() not in ['it_manager', 'general_director', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        c = Candidate.query.get_or_404(id)
        data = request.json

        if 'full_name' in data: c.full_name = data['full_name']
        if 'email' in data: c.email = data['email']
        if 'phone' in data: c.phone = data['phone']
        if 'nationality' in data: c.nationality = data['nationality']
        if 'applied_position' in data: c.applied_position = data['applied_position']
        if 'specialty' in data: c.specialty = data['specialty']
        if 'experience' in data: c.experience = data['experience']
        if 'education' in data: c.education = data['education']
        if 'skills' in data: c.skills = data['skills']
        if 'status' in data: c.status = data['status']
        if 'department_id' in data: c.department_id = data['department_id']

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Candidate updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ------------------------------------------------------------
# DELETE A CANDIDATE
# ------------------------------------------------------------
@api_candidate_bp.route('/<int:id>', methods=['DELETE'])
@mobile_auth_required
def delete_candidate(id):
    try:
        current_user = getattr(request, "user", None)
        if current_user.role.lower() not in ['it_manager', 'general_director', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        c = Candidate.query.get_or_404(id)
        
        db.session.delete(c)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Candidate deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@api_candidate_bp.route('/<int:id>/promote', methods=['POST'])
@mobile_auth_required
def promote_candidate(id):
    try:
        from core.models import Employee
        current_user = getattr(request, "user", None)
        if current_user.role.lower() not in ['it_manager', 'general_director', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        c = Candidate.query.get_or_404(id)
        
        # Check if already hired
        if c.status == 'hired':
            # Check if employee record already exists
            existing_emp = Employee.query.filter_by(full_name=c.full_name).first() # Basic check
            if existing_emp:
                return jsonify({'success': False, 'message': 'Candidate already promoted'}), 400

        # Create new employee
        new_emp = Employee(
            full_name=c.full_name,
            job_title=c.applied_position,
            phone=c.phone,
            nationality=c.nationality,
            department_id=c.department_id
        )
        
        c.status = 'hired'
        db.session.add(new_emp)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Candidate promoted to Employee record successfully',
            'employee_id': new_emp.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@api_candidate_bp.route('/<int:id>/cv', methods=['GET'])
@mobile_auth_required
def download_cv(id):
    try:
        c = Candidate.query.get_or_404(id)
        if not c.cv_filepath:
            return jsonify({'success': False, 'message': 'No CV found'}), 404
        return send_file(c.cv_filepath, as_attachment=True)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_candidate_bp.route('/<int:id>/id-document', methods=['GET'])
@mobile_auth_required
def download_id_document(id):
    try:
        c = Candidate.query.get_or_404(id)
        return send_file(c.id_document_filepath, as_attachment=True)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
