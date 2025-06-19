from flask import Flask
from app.config import Config
from app.extensions import db, migrate, cors
from app.routes.ask import ask_bp
from app.routes.interactions import interactions_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)

    app.register_blueprint(ask_bp)
    app.register_blueprint(interactions_bp)

    return app

