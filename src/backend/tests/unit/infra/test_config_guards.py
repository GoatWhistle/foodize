from settings.config.infra.s3 import S3Config


def test_s3_default_creds_flagged_insecure() -> None:
    cfg = S3Config()
    assert cfg.is_default_insecure is True


def test_s3_default_access_key_flagged() -> None:
    cfg = S3Config(access_key="minioadmin", secret_key="strong-secret")
    assert cfg.is_default_insecure is True


def test_s3_default_secret_key_flagged() -> None:
    cfg = S3Config(access_key="strong-key", secret_key="minioadmin")
    assert cfg.is_default_insecure is True


def test_s3_custom_creds_not_flagged() -> None:
    cfg = S3Config(access_key="prod-access", secret_key="prod-secret")
    assert cfg.is_default_insecure is False
