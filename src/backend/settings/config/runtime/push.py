from settings.config.base import BaseConfig


class PushConfig(BaseConfig):
    apns_key: str | None = None
    apns_key_id: str | None = None
    apns_team_id: str | None = None
    apns_topic: str | None = None
    apns_use_sandbox: bool = False
    apns_base_url: str = "https://api.push.apple.com"
    apns_sandbox_base_url: str = "https://api.sandbox.push.apple.com"

    fcm_project_id: str | None = None
    fcm_credentials_json: str | None = None
    fcm_server_key: str | None = None

    request_timeout_seconds: float = 10.0

    @property
    def apns_enabled(self) -> bool:
        return bool(
            self.apns_key and self.apns_key_id and self.apns_team_id and self.apns_topic
        )

    @property
    def fcm_enabled(self) -> bool:
        return bool(self.fcm_server_key or (self.fcm_project_id and self.fcm_credentials_json))
