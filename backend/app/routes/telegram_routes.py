from flask import Blueprint
from flask import request, jsonify
from app.database.mongo import db
from app.utils.telegram_messanger import send_telegram_message

telegram_bp = Blueprint("telegram", __name__)

@telegram_bp.route("/telegram/webhook", methods=["POST"])
def telegram_webhook():
    update = request.get_json()

    if "message" not in update:
        return "ok", 200

    message = update["message"]
    chat_id = message["chat"]["id"]
    text = message.get("text", "")
    chat_type = message["chat"]["type"]  # private / group / supergroup

    if text.startswith("/start"):
        reply = (
            f"✅ Telegram Connected Successfully!\n\n"
            f"📌 Your Chat ID:\n<code>{chat_id}</code>\n\n"
            f"📂 Chat Type: {chat_type}\n\n"
            f"👉 Save this Chat ID in your profile."
        )

        send_telegram_message(reply, chat_id)

        # OPTIONAL: auto-store user
        # if chat_type == "private":
        #     db.telegram_users.update_one(
        #         {"chat_id": chat_id}, {"$set": {"chat_id": chat_id}}, upsert=True
        #     )

    return "ok", 200

@telegram_bp.route('/api/branch-telegram', methods=['GET'])
def get_branch_telegram():
    try:
        branch = request.args.get('branch')
        sem = request.args.get('sem')
        
        if not branch or not sem:
            return jsonify({"success": False, "error": "Branch and semester are required"}), 400
        
        # Get the first class in this branch-semester to fetch its chat IDs
        classwise_col = db.classwise_faculty
        
        # Find any class in this branch-semester
        class_data = classwise_col.find_one({
            "branch": branch,
            "sem": int(sem)
        })
        
        if class_data:
            # Support both single chat_id and array of chat_ids for backward compatibility
            telegram_chat_ids = class_data.get('telegram_chat_ids', [])
            
            # If it's a single string (old format), convert to array
            if isinstance(telegram_chat_ids, str):
                telegram_chat_ids = [telegram_chat_ids] if telegram_chat_ids.strip() else []
            # If it's None, use empty array
            elif telegram_chat_ids is None:
                telegram_chat_ids = []
            
            return jsonify({
                "success": True,
                "telegram_chat_ids": telegram_chat_ids
            }), 200
        else:
            return jsonify({
                "success": True,
                "telegram_chat_ids": []
            }), 200
            
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 400


@telegram_bp.route('/api/branch-telegram', methods=['PUT'])
def update_branch_telegram():
    try:
        data = request.get_json()
        branch = data.get('branch')
        sem = data.get('sem')
        telegram_chat_ids = data.get('telegram_chat_ids', [])
        
        if not branch or not sem:
            return jsonify({"success": False, "error": "Branch and semester are required"}), 400
        
        # Ensure telegram_chat_ids is a list
        if not isinstance(telegram_chat_ids, list):
            return jsonify({"success": False, "error": "telegram_chat_ids must be an array"}), 400
        
        # Filter out empty strings and trim
        cleaned_chat_ids = [str(chat_id).strip() for chat_id in telegram_chat_ids if str(chat_id).strip()]
        
        # Update Telegram Chat IDs for all classes in this branch-semester
        classwise_col = db.classwise_faculty
        
        # Find all classes in this branch-semester
        classes = classwise_col.find({
            "branch": branch,
            "sem": int(sem)
        })
        
        # Update each class with the new Telegram Chat IDs
        update_count = 0
        for class_data in classes:
            result = classwise_col.update_one(
                {"_id": class_data["_id"]},
                {"$set": {"telegram_chat_ids": cleaned_chat_ids}}
            )
            if result.modified_count > 0:
                update_count += 1
        
        return jsonify({
            "success": True,
            "message": f"Telegram Chat IDs updated for {update_count} classes in {branch} Semester {sem}",
            "telegram_chat_ids": cleaned_chat_ids
        }), 200
            
    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 400