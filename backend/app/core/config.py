import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "STOCK AI API")
APP_VERSION = os.getenv("APP_VERSION", "2.0.0")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"