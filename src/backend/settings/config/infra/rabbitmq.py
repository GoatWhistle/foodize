from pydantic import AmqpDsn

from settings.config.base import BaseConfig

_INSECURE_DEFAULT = "amqp://foodize:foodize@rabbitmq:5672/foodize"


class RabbitMQConfig(BaseConfig):
    url: AmqpDsn | str = _INSECURE_DEFAULT

    @property
    def is_default_insecure(self) -> bool:
        return str(self.url) == _INSECURE_DEFAULT
