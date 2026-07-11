from settings.config.base import BaseConfig


class S3Config(BaseConfig):
    endpoint_url: str = "http://minio:9000"
    region: str = "us-east-1"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket: str = "foodize-media"
    public_base_url: str = "http://localhost:9000/foodize-media"

    @property
    def enabled(self) -> bool:
        return bool(self.bucket and (self.endpoint_url or self.access_key))

    @property
    def is_default_insecure(self) -> bool:
        return self.access_key == "minioadmin" or self.secret_key == "minioadmin"
