from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from core.extensions import db
from core.models import LeaveRequest, User
from datetime import datetime

api_leave_bp = Blueprint('api_leave', __name__, url_prefix='/api/leaves')

@api_leave_bp.route('', methods=['GET'])
@login_required
def get_leaves():
    try:
        leaves = LeaveRequest.query.filter_by(user_id=current_user.id).all()
        return jsonify({
            'success': True,
            'leaves': [{
                'id': lv.id,
                'type': lv.type,
                'start_date': lv.start_date.isoformat(),
                'end_date': lv.end_date.isoformat(),
                'reason': lv.reason,
                'status': lv.status,
                'created_at': lv.created_at.isoformat()
            } for lv in leaves]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_leave_bp.route('/pending', methods=['GET'])
@login_required
def get_pending():
    try:
        leaves = LeaveRequest.query.filter_by(status='pending').all()
        return jsonify({
            'success': True,
            'leaves': [{
                'id': lv.id,
                'requester': {
                    'id': lv.requester.id,
                    'name': lv.requester.name
                },
                'type': lv.type,
                'start_date': lv.start_date.isoformat(),
                'end_date': lv.end_date.isoformat(),
                'reason': lv.reason,
                'created_at': lv.created_at.isoformat()
            } for lv in leaves]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_leave_bp.route('', methods=['POST'])
@login_required
def create_leave():
    try:
        data = request.json
        leave = LeaveRequest(
            user_id=current_user.id,
            type=data.get('type', 'annual'),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date(),
            reason=data.get('reason'),
            status='pending'
        )
        db.session.add(leave)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Leave request created',
            'leave_id': leave.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@api_leave_bp.route('/<int:id>/approve', methods=['POST'])
@login_required
def approve_leave(id):
    try:
        leave = LeaveRequest.query.get_or_404(id)
        leave.status = 'approved'
        leave.approver_id = current_user.id
        leave.decided_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True, 'message': 'Leave approved'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@api_leave_bp.route('/<int:id>/reject', methods=['POST'])
@login_required
def reject_leave(id):
    try:
        leave = LeaveRequest.query.get_or_404(id)
        leave.status = 'rejected'
        leave.approver_id = current_user.id
        leave.decided_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True, 'message': 'Leave rejected'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
