from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Security / JWT
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    MEDIA_ROOT: str = "/data"   # <-- BURADA!
    MAX_UPLOAD_MB: int = 5      # opsiyonel

    AZURE_API_KEY: str
    AZURE_ENDPOINT: str
    AZURE_DEPLOYMENT: str
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8"
    )


settings = Settings()
