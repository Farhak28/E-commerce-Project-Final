"""Thesis orchestration — verified content, diagrams, no duplicate sections."""

from thesis_build import (
    AUTHOR,
    SUPERVISOR,
    TITLE,
    add_bullets,
    add_heading,
    add_numbered,
    add_page_break,
    add_paragraph,
    add_screenshot_placeholder,
    add_table,
)
from thesis_content_appendix import build_entity_deep_dive, build_full_er_and_tests
from thesis_content_deep import build_deep_content
from thesis_content_extended import build_extended_content
from thesis_content_tools import build_tools_and_mapping
from thesis_diagrams import build_all_diagrams


def build_all_sections(doc) -> None:
    build_front_matter(doc)
    build_chapter1_intro(doc)
    build_chapter2_background(doc)
    build_chapter3_requirements(doc)
    build_all_diagrams(doc)
    build_extended_content(doc)
    build_deep_content(doc)
    build_tools_and_mapping(doc)
    build_entity_deep_dive(doc)
    build_full_er_and_tests(doc)
    build_chapter12_conclusion(doc)
    build_appendix_screenshots(doc)
    build_appendix_ethics(doc)
    build_appendix_reproducibility(doc)
    build_appendix_disclosure(doc)
    build_references(doc)


def build_front_matter(doc) -> None:
    add_heading(doc, "Declaration of Originality", 1)
    add_paragraph(
        doc,
        f'I, {AUTHOR}, declare that this thesis entitled "{TITLE}" is my own work. '
        "Sources are cited in References.",
    )
    add_paragraph(doc, "Signature: _________________________    Date: _________________________")
    add_page_break(doc)

    add_heading(doc, "Abstract", 1)
    add_paragraph(
        doc,
        "Corner Store is a full-stack e-commerce graduation project: Next.js 16, ASP.NET Core 8, "
        "SQL Server 2022 (catalog + identity), Redis 7, Docker Compose. The seed catalog has 59 products, "
        "6 types, 29 brands. Commerce includes cart, Stripe/InstaPay/COD checkout, inventory deduction, "
        "notifications, wishlist, compare, and admin analytics.",
    )
    add_paragraph(
        doc,
        "AI uses Google Gemini (gemini-2.5-flash, text-embedding-004): RAG over seven policy documents, "
        "ten assistant tools, visual search with VisualProductMatcher tiers (85/55/25), lexicon review "
        "summaries, and admin observability. Recommendations use co-purchase and purchase volume from "
        "OrderItem.ProductId snapshots.",
    )
    add_page_break(doc)

    add_heading(doc, "Acknowledgment", 1)
    add_paragraph(doc, f"I thank {SUPERVISOR} and Helwan University for their support.")
    add_page_break(doc)

    add_heading(doc, "Table of Contents", 1)
    add_numbered(
        doc,
        [
            "Table of Contents",
            "List of Figures",
            "Chapter 1: Introduction",
            "Chapter 2: Background",
            "Chapter 3: Requirements",
            "Chapter 4: System Design and Diagrams (Use Case, ER, Class, Sequence, Activity, State, Package)",
            "Chapter 5: Data Model Reference",
            "Chapter 6: REST API Reference",
            "Chapter 7: Frontend Application",
            "Chapter 8: Backend Services",
            "Chapter 9: AI Subsystem",
            "Chapter 10: Business Feasibility (Hypothetical)",
            "Chapter 11: Testing",
            "Chapter 12: Conclusion",
            "Appendix A: Screenshot Placeholders",
            "Appendix B: AI Ethics",
            "Appendix C: Reproducibility",
            "Appendix D: Generative AI Disclosure",
            "Appendix E: Detailed ER Lists",
            "Appendix F: Unit Test Catalog",
            "Appendix G: Assistant DTOs",
            "Appendix H: API Business Error Codes",
            "References",
        ],
    )
    add_page_break(doc)

    add_heading(doc, "List of Figures", 1)
    figures = [
        "Figure 4.1 — Use case diagram",
        "Figure 4.2 — Store ER diagram",
        "Figure 4.3 — Identity ER diagram",
        "Figure 4.4 — Redis key structure",
        "Figure 4.5 — Domain class diagram",
        "Figure 4.6 — Service layer class diagram",
        "Figure 4.7 — AI module class diagram",
        "Figure 4.8 — Frontend logical structure",
        "Figure 4.9 — Docker deployment diagram",
        "Figure 4.10 — Login sequence",
        "Figure 4.11 — Cart-to-order sequence",
        "Figure 4.12 — Stripe payment sequence",
        "Figure 4.13 — Assistant chat sequence",
        "Figure 4.14 — Visual search sequence",
        "Figure 4.15 — Co-purchase recommendation sequence",
        "Figure 4.16 — Checkout activity diagram",
        "Figure 4.17 — Order status activity diagram",
        "Figure 4.18 — Assistant tool loop activity",
        "Figure 4.19 — Knowledge reindex activity",
        "Figure 4.20 — Admin product upload activity",
        "Figure 4.21 — Backend package diagram",
        "Figure 4.22 — Basket and order state diagram",
        "Figure E.1 — Detailed ER attribute lists (Appendix E)",
        "Figures A.1–A.7 — Application screenshots (Appendix A, user-supplied)",
    ]
    add_numbered(doc, figures)
    add_page_break(doc)


def build_chapter1_intro(doc) -> None:
    add_heading(doc, "Chapter 1: Introduction", 1)
    add_heading(doc, "1.1 Problem", 2)
    add_paragraph(
        doc,
        "E-commerce sites often lack grounded AI assistance, visual product discovery, and recommendations "
        "based on real purchase data. Corner Store integrates these into one deployable Clean Architecture "
        "solution suitable for academic evaluation and demonstration.",
    )
    add_heading(doc, "1.2 Objectives", 2)
    add_bullets(
        doc,
        [
            "Implement full e-commerce flows with Docker reproducibility.",
            "Ground the assistant via RAG and ten Gemini function-calling tools.",
            "Implement visual search and purchase-based recommendations.",
            "Document the system with UML-style diagrams derived from source code.",
        ],
    )
    add_heading(doc, "1.3 Scope", 2)
    add_paragraph(
        doc,
        "In scope: the CornerStore/ repository. Out of scope: custom ML training, production Kubernetes. "
        "Chapter 10 business analysis is hypothetical planning, not measured store performance.",
    )
    add_page_break(doc)


def build_chapter2_background(doc) -> None:
    add_heading(doc, "Chapter 2: Background", 1)
    add_paragraph(
        doc,
        "The backend follows Clean Architecture (Domain → Persistence → Services → Presentation → Api). "
        "RAG reduces policy hallucination by retrieving KnowledgeChunk text before generation. Tool calling "
        "routes product and order queries to ProductService and OrderService. The frontend uses Next.js App "
        "Router with React contexts for cart, auth, and assistant state.",
    )
    add_page_break(doc)


def build_chapter3_requirements(doc) -> None:
    add_heading(doc, "Chapter 3: Requirements", 1)
    add_table(
        doc,
        ["ID", "Requirement", "Implementation"],
        [
            ["FR-01", "Product catalog with search/filter", "ProductsController, products-catalog.tsx"],
            ["FR-02", "Redis cart", "BasketsController, BasketRepository 7-day TTL"],
            ["FR-03", "JWT auth", "AuthenticationService, 1-hour token"],
            ["FR-04", "Orders + stock", "OrderService StockDeducted"],
            ["FR-05", "Stripe payments", "PaymentService + webhook"],
            ["FR-06", "AI assistant", "ChatAssistantService + 10 tools"],
            ["FR-07", "Visual search", "VisualSearchService, 10 MB limit"],
            ["FR-08", "Purchase recommendations", "RecommendationService co-purchase"],
            ["FR-09", "Admin AI console", "AdminController /ai/*, admin/ai/* pages"],
            ["NFR-01", "Docker deploy", "docker-compose.yml four services"],
            ["NFR-02", "Graceful AI fallback", "assistant-logic.ts, keyword RAG"],
        ],
    )
    add_page_break(doc)


def build_chapter12_conclusion(doc) -> None:
    add_heading(doc, "Chapter 12: Conclusion", 1)
    add_paragraph(
        doc,
        "Corner Store delivers a documented e-commerce platform with ER/class/sequence/activity/use-case "
        "diagrams aligned to the implementation. AI features are observable via admin logs and events. "
        "Future work: persistent vector DB, integration tests, Arabic NLP, production CORS hardening.",
    )
    add_page_break(doc)


def build_appendix_screenshots(doc) -> None:
    add_heading(doc, "Appendix A: Screenshot Placeholders", 1)
    add_paragraph(doc, "Insert application screenshots during final formatting (not included in page count below).")
    for i, desc in enumerate(
        [
            "Home and catalog",
            "Product detail with recommendations and AI insights",
            "Cart and checkout",
            "Assistant and visual search",
            "Account dashboard",
            "Admin dashboard and AI overview",
            "Swagger UI",
        ],
        1,
    ):
        add_screenshot_placeholder(doc, f"Figure A.{i}", desc)
    add_page_break(doc)


def build_appendix_ethics(doc) -> None:
    add_heading(doc, "Appendix B: AI Ethics", 1)
    add_paragraph(
        doc,
        "Visual search prompt forbids person identification (VisualSearchService VisionPrompt). "
        "Product and order facts should come from tools. Knowledge documents are admin-editable. "
        "AssistantInteractionLog supports audit.",
    )
    add_page_break(doc)


def build_appendix_reproducibility(doc) -> None:
    add_heading(doc, "Appendix C: Reproducibility", 1)
    add_bullets(
        doc,
        [
            "cd CornerStore && docker compose up --build",
            "http://localhost:3848 — frontend",
            "http://localhost:5141/swagger — API",
            "GEMINI_API_KEY in .env for AI",
            "BootstrapAdmin__* env vars on empty identity DB",
            "dotnet test backend/ECommerce.Services.Tests",
        ],
    )
    add_page_break(doc)


def build_appendix_disclosure(doc) -> None:
    add_heading(doc, "Appendix D: Generative AI Disclosure", 1)
    add_paragraph(
        doc,
        "Runtime AI: GeminiProvider.cs. Documentation claims verified against source and Swagger. "
        "Vector store: InMemoryVectorStore + KnowledgeChunk.EmbeddingJson.",
    )
    add_page_break(doc)


def build_references(doc) -> None:
    add_heading(doc, "References", 1)
    for ref in [
        "[1] P. Lewis et al., Retrieval-Augmented Generation, NeurIPS 2020.",
        "[2] Google Gemini API documentation, https://ai.google.dev/",
        "[3] Microsoft ASP.NET Core docs, https://learn.microsoft.com/aspnet/core",
        "[4] Next.js docs, https://nextjs.org/docs",
        "[5] Corner Store repository: CornerStore/frontend, backend, docker-compose.yml",
    ]:
        add_paragraph(doc, ref)
