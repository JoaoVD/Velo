from abc import ABC, abstractmethod


class LLMConnector(ABC):
    @abstractmethod
    async def query(self, prompt: str) -> str:
        pass


def build_consumer_prompt(brand_name: str, keyword: str) -> str:
    """Builds a prompt simulating a real consumer search. Does NOT mention the brand name."""
    return (
        f"Preciso de ajuda com o seguinte: {keyword}. "
        f"Quais são as melhores opções disponíveis? "
        f"Por favor, liste de 3 a 5 opções específicas com nome completo e uma breve descrição de cada uma."
    )
