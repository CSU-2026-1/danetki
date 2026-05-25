from __future__ import annotations

import logging
from typing import Final
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup, Tag

from app.config import Settings
from app.scraper.validator import ParsedStory, validate_story

logger = logging.getLogger(__name__)

FACTROOM_BASE_URL: Final[str] = "https://www.factroom.ru"
FACTROOM_LIST_PATH: Final[str] = "/kriminal"

# Подкатегории — выглядят как /kriminal/<slug> и сами по себе не статьи.
# Если попадутся в листинге, пропускаем.
FACTROOM_CATEGORY_SLUGS: Final[frozenset[str]] = frozenset({
    "afery", "bandy", "vory", "kiberprestupnost", "piratstvo",
    "pohishcheniya", "terror", "tyurma", "ubijstva",
})

# Сколько страниц листинга максимум обойдём, добирая статьи до limit.
FACTROOM_MAX_PAGES: Final[int] = 10


class FactroomScraper:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._headers = {"User-Agent": settings.scraper_user_agent}

    async def fetch_stories(self, limit: int) -> list[ParsedStory]:
        async with httpx.AsyncClient(
            timeout=self._settings.http_timeout,
            headers=self._headers,
            follow_redirects=True,
        ) as client:
            stories: list[ParsedStory] = []
            seen_links: set[str] = set()

            for page in range(1, FACTROOM_MAX_PAGES + 1):
                if len(stories) >= limit:
                    break

                if page == 1:
                    list_url = urljoin(FACTROOM_BASE_URL, FACTROOM_LIST_PATH)
                else:
                    list_url = urljoin(
                        FACTROOM_BASE_URL,
                        f"{FACTROOM_LIST_PATH}/page/{page}",
                    )

                try:
                    response = await client.get(list_url)
                    response.raise_for_status()
                except httpx.HTTPError:
                    logger.warning("Failed to fetch listing: %s", list_url)
                    break

                page_links = self._extract_article_links(response.text)
                if not page_links:
                    break

                for link in page_links:
                    if len(stories) >= limit:
                        break
                    if link in seen_links:
                        continue
                    seen_links.add(link)

                    story = await self._fetch_article(client, link)
                    if story is None:
                        continue
                    stories.append(story)

            return stories

    def _extract_article_links(self, html: str) -> list[str]:
        soup = BeautifulSoup(html, "html.parser")
        links: list[str] = []

        # Карточки лежат в <section class="new-text-posts">.
        # Каждая карточка — либо new-text-post-outer (обычная статья),
        # либо feed-picture-fact-outer (фотофакт). Оба типа — валидные статьи.
        # На странице раздела factroom публикует кураторскую выборку:
        # статьи живут в разных разделах сайта (/izvestnye-lyudi, /istoriya, ...),
        # а в раздел /kriminal подтягиваются по тегам.
        container = soup.select_one("section.new-text-posts")
        cards = container.find_all("div", recursive=False) if container else []

        for card in cards:
            for anchor in card.find_all("a", href=True):
                if not isinstance(anchor, Tag):
                    continue
                href = anchor.get("href")
                if not href or not isinstance(href, str):
                    continue

                full_url = urljoin(FACTROOM_BASE_URL, href)
                if full_url in links:
                    continue
                if not self._is_article_url(full_url):
                    continue
                links.append(full_url)
                break  # одной ссылки на карточку достаточно

        return links

    @staticmethod
    def _is_article_url(url: str) -> bool:
        parsed = urlparse(url)
        if "factroom.ru" not in parsed.netloc:
            return False
        parts = [p for p in parsed.path.split("/") if p]
        if not parts:
            return False
        if "page" in parts:
            return False
        # Корень раздела или подкатегория-листинг: /kriminal, /kriminal/afery,
        # /izvestnye-lyudi, /istoriya/voennaya и т.п. — это не статьи.
        # Эвристика: подкатегория = 2 сегмента + второй короткий slug без дефисов.
        if len(parts) == 1:
            return False
        if len(parts) == 2 and "-" not in parts[1]:
            return False
        if len(parts) == 2 and parts[0] == "kriminal" and parts[1] in FACTROOM_CATEGORY_SLUGS:
            return False
        return True

    async def _fetch_article(
        self,
        client: httpx.AsyncClient,
        url: str,
    ) -> ParsedStory | None:
        try:
            response = await client.get(url)
            response.raise_for_status()
        except httpx.HTTPError:
            logger.warning("Failed to fetch article: %s", url)
            return None

        return self._parse_article_html(response.text, url)

    def _parse_article_html(self, html: str, url: str) -> ParsedStory | None:
        soup = BeautifulSoup(html, "html.parser")

        title_tag = soup.find("h1") or soup.select_one("h1.entry-title, h1.post-title")
        if title_tag is None:
            return None

        # Новый шаблон factroom — section.post-box-text. Оставляем старые селекторы как fallback.
        content_tag = soup.select_one(
            "section.post-box-text, .entry-content, .post-content, article .content, .text-content"
        )
        if content_tag is None:
            return None

        for unwanted in content_tag.select("script, style, noscript, .ads, .share, .ya-share2"):
            unwanted.decompose()

        paragraphs = [
            paragraph.get_text(strip=True)
            for paragraph in content_tag.find_all("p")
            if paragraph.get_text(strip=True)
        ]
        if not paragraphs:
            text = content_tag.get_text(separator=" ", strip=True)
        else:
            text = " ".join(paragraphs)

        return validate_story(title_tag.get_text(strip=True), text, url)


class ScraperRegistry:
    @classmethod
    def get_scraper(cls, source_url: str, settings: Settings) -> FactroomScraper:
        if source_url and "factroom" not in source_url:
            raise ValueError(f"Unsupported source: {source_url}")

        return FactroomScraper(settings)
