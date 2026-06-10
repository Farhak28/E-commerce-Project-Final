"""Detailed ER diagram, test catalog, entity deep-dive."""

from thesis_build import add_figure_image, add_heading, add_page_break, add_paragraph, add_table
from thesis_diagrams import get_appendix_er_image

TESTS = [
    (
        "ReviewSummaryServiceTests — ClassifiesPositiveAndNegativeReviews",
        "3 mock reviews; asserts battery in positive themes, charging in negative themes.",
    ),
    (
        "ReviewSummaryServiceTests — ReturnsNull_WhenProductMissing",
        "Product 99 NotFound → null summary.",
    ),
    (
        "VisualProductMatcherTests — PrioritizesExactNameAndBrand",
        "Samsung Galaxy A35 in ExactMatches with score >= 85.",
    ),
    (
        "RagChunkingTests — AppliesOverlapBetweenChunks",
        "1500 chars → 2+ chunks, step 700 with size 800 overlap 100.",
    ),
    (
        "RagChunkingTests — ReturnsEmpty_ForBlankContent",
        "Whitespace-only → empty chunk list.",
    ),
]


def build_full_er_and_tests(doc) -> None:
    add_heading(doc, "Appendix E: Detailed ER Attribute Lists", 1)
    add_figure_image(doc, "Figure E.1: Store database tables and keys.", get_appendix_er_image(), width_inches=6.8)

    add_heading(doc, "Appendix F: Unit Test Catalog", 1)
    add_table(doc, ["Test", "Verification"], TESTS)

    add_heading(doc, "Appendix G: Assistant DTOs", 1)
    add_paragraph(
        doc,
        "AssistantChatRequestDTO: SessionId, Message, Context (cart/recent/compare IDs). "
        "AssistantChatResponseDTO: SessionId, Text, Products[], Configured, Provider, Structured. "
        "ChatApiRequestDTO alias used by POST /api/chat.",
    )
    add_page_break(doc)


def build_entity_deep_dive(doc) -> None:
    from thesis_content_extended import ENTITIES

    add_heading(doc, "Chapter 5 (continued): Per-Table Field Listing", 1)
    for title, fields in ENTITIES:
        add_heading(doc, title, 2)
        add_table(doc, ["Field", "Notes"], fields)
    add_page_break(doc)
