from flask import Blueprint, jsonify, request
from core.extensions import db
from core.models import EmployeeRequest, User
from modules.auth.jwt_utils import mobile_auth_required
from datetime import datetime

api_mobile_requests_bp = Blueprint('api_mobile_requests', __name__, url_prefix='/api/mobile/requests')

@api_mobile_requests_bp.route('', methods=['GET'])
@mobile_auth_required
def get_my_requests():
    try:
        user_id = getattr(request, "user_id", None)
        requests = EmployeeRequest.query.filter_by(user_id=user_id).order_by(EmployeeRequest.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'requests': [{
                'id': req.id,
                'category': req.category,
                'subject': req.subject,
                'message': req.message,
                'status': req.status,
                'response': req.response,
                'date': req.created_at.strftime('%Y-%m-%d') if req.created_at else None
            } for req in requests]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_mobile_requests_bp.route('', methods=['POST'])
@mobile_auth_required
def create_request():
    try:
        user_id = getattr(request, "user_id", None)
        data = request.json
        
        if not data.get('category') or not data.get('subject') or not data.get('message'):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        new_request = EmployeeRequest(
            user_id=user_id,
            category=data['category'],
            subject=data['subject'],
            message=data['message'],
            status='pending'
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Request submitted successfully',
            'request': {
                'id': new_request.id,
                'category': new_request.category,
                'subject': new_request.subject,
                'message': new_request.message,
                'status': new_request.status,
                'date': new_request.created_at.strftime('%Y-%m-%d')
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@api_mobile_requests_bp.route('/all', methods=['GET'])
@mobile_auth_required
def get_all_requests():
    try:
        user = getattr(request, "user", None)
        # Check permissions
        if user.role not in ['it_manager', 'general_director', 'general_manager', 'head_of_department', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        # Fetch all requests, pending first
        requests = EmployeeRequest.query.order_by(
            (EmployeeRequest.status == 'pending').desc(),
            EmployeeRequest.created_at.desc()
        ).all()
        
        return jsonify({
            'success': True,
            'requests': [{
                'id': req.id,
                'user': {
                    'id': req.user.id,
                    'name': req.user.name,
                    'role': req.user.role,
                    'avatar': req.user.avatar,
                    'position': req.user.position
                },
                'category': req.category,
                'subject': req.subject,
                'message': req.message,
                'status': req.status,
                'response': req.response,
                'date': req.created_at.strftime('%Y-%m-%d') if req.created_at else None
            } for req in requests]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_mobile_requests_bp.route('/<int:id>', methods=['PUT'])
@mobile_auth_required
def update_request(id):
    try:
        user = getattr(request, "user", None)
        # Check permissions
        if user.role not in ['it_manager', 'general_director', 'general_manager', 'head_of_department', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        req_obj = EmployeeRequest.query.get(id)
        if not req_obj:
            return jsonify({'success': False, 'message': 'Request not found'}), 404

        data = request.json
        if 'status' in data:
            req_obj.status = data['status']
        if 'response' in data:
            req_obj.response = data['response']
        
        req_obj.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Request updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
