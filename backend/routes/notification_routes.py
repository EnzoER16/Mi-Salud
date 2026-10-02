from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.notification import Notification

notification_bp = Blueprint("notification", __name__, url_prefix="/api/notifications")


@notification_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_notifications():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(id_user=user_id).order_by(
        Notification.created_at.desc()).limit(20).all()
    unread_count = Notification.query.filter_by(id_user=user_id, is_read=False).count()
    return jsonify({
        "notifications": [n.to_json() for n in notifications],
        "unread_count": unread_count}), 200


@notification_bp.route("/read-all", methods=["PATCH"])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    Notification.query.filter_by(id_user=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "Notificaciones marcadas como leídas."}), 200


@notification_bp.route("/<notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notification_id):
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(
        id_notification=notification_id, id_user=user_id).first()
    if not notification:
        return jsonify({"message": "Notificación no encontrada."}), 404
    notification.is_read = True
    db.session.commit()
    return jsonify(notification.to_json()), 200