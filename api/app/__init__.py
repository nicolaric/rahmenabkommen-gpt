from flask import Flask
from app.config import Config
from app.extensions import db, migrate, cors
from app.routes.ask import ask_bp
from app.routes.stats import stats_bp
from app.routes.sitemap import sitemap_bp
from app.routes.conversations import conversations_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)

    app.register_blueprint(ask_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(sitemap_bp)

    return app

