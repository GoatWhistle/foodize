from settings.config.base import BaseConfig


class S3Config(BaseConfig):
    # Endpoint the backend uses to reach the object storage (e.g. http://minio:9000
    # for a local MinIO container, empty for real AWS S3).
    endpoint_url: str = "http://minio:9000"
    region: str = "us-east-1"
    access_key: str = "minioadmin"
    secret_key: str = "minioadmin"
    bucket: str = "foodize-media"
    # Base URL that browsers use to load the stored objects. For local MinIO this is
    # the host-published address including the bucket, e.g.
    # http://localhost:9000/foodize-media. For prod set it to the CDN / S3 public URL.
    public_base_url: str = "http://localhost:9000/foodize-media"

    @property
    def enabled(self) -> bool:
        return bool(self.bucket and (self.endpoint_url or self.access_key))
