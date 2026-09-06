import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

db_url = os.environ.get("DATABASE_URL", "sqlite:///memory_layer.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
    
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

model = YOLO("models/best.pt")

class AssetHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.String(100), nullable=False)
    damage_class = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default="logged")

class CalibrationLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.String(100), nullable=False)
    original_class = db.Column(db.String(50), nullable=False)
    corrected_class = db.Column(db.String(50), nullable=False)

with app.app_context():
    db.create_all()

@app.route("/api/assess", methods=["POST"])
def assess_claim():
    # Dynamically handle either 'video' or 'image' depending on your frontend setup
    file_key = "video" if "video" in request.files else "image" if "image" in request.files else None
    
    if not file_key or "asset_id" not in request.form:
        return jsonify({"error": "Missing media file or asset_id"}), 400
        
    asset_id = request.form["asset_id"]
    media_file = request.files[file_key]
    
    temp_path = f"temp_capture_{asset_id}.webm"
    media_file.save(temp_path)
    
    # Process the video file frame-by-frame using YOLO
    results = model.predict(source=temp_path, stream=True, conf=0.25)
    
    highest_conf_per_class = {}
    for frame in results:
        for box in frame.boxes:
            cls_name = model.names[int(box.cls)]
            conf = float(box.conf)
            if cls_name not in highest_conf_per_class or conf > highest_conf_per_class[cls_name]:
                highest_conf_per_class[cls_name] = conf
                
    detections = [{"class": k, "confidence": v} for k, v in highest_conf_per_class.items()]
    
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    # Memory Layer Check
    flags = []
    history = AssetHistory.query.filter_by(asset_id=asset_id).all()
    for past in history:
        for det in detections:
            if det["class"] == past.damage_class and past.status == "repaired":
                flags.append(f"Flag: {past.damage_class} was previously repaired on this asset.")

    return jsonify({
        "asset_id": asset_id, 
        "ai_detections": detections, 
        "memory_flags": flags, 
        "status": "review_required" if flags else "auto_approved"
    })

@app.route("/api/feedback", methods=["POST"])
def adjuster_feedback():
    data = request.json
    log = CalibrationLog(asset_id=data['asset_id'], original_class=data['original_class'], corrected_class=data['corrected_class'])
    history = AssetHistory(asset_id=data['asset_id'], damage_class=data['corrected_class'], status='logged')
    db.session.add(log)
    db.session.add(history)
    db.session.commit()
    return jsonify({"message": "Feedback integrated into memory layer"})

@app.route("/api/claims/history", methods=["GET"])
def get_all_history():
    records = AssetHistory.query.all()
    return jsonify([{"id": r.id, "asset_id": r.asset_id, "damage_class": r.damage_class, "status": r.status} for r in records])

if __name__ == "__main__":
    app.run(port=5000, debug=True)
