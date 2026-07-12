from pydantic import AmqpDsn, Field

from settings.config.base import BaseConfig

_INSECURE_DEFAULT = "amqp://foodize:foodize@rabbitmq:5672/foodize"


class RabbitMQConfig(BaseConfig):
    url: AmqpDsn | str = _INSECURE_DEFAULT
    worker_metrics_port: int = Field(default=9200, validation_alias="WORKER_METRICS_PORT")

    @property
    def is_default_insecure(self) -> bool:
        return str(self.url) == _INSECURE_DEFAULT
