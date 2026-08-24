from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import timedelta
import os

db = SQLAlchemy()
load_dotenv()

class Configuration:
    MYSQL_USER = os.environ.get("MYSQL_USER")
    MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD")
    MYSQL_HOST = os.environ.get("MYSQL_HOST")
    MYSQL_PORT = os.environ.get("MYSQL_PORT")
    DATABASE_NAME = os.environ.get("DATABASE_NAME")

    SQLALCHEMY_DATABASE_URI = (f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{DATABASE_NAME}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS").split(",")