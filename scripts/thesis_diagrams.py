"""UML diagrams as rendered PNG images embedded in the thesis."""

from thesis_build import add_figure_image, add_heading, add_page_break, add_paragraph
from thesis_diagram_render import render_all

# Generated once per build; keyed by figure id
_DIAGRAMS: dict[str, str] | None = None


def _diagrams() -> dict[str, str]:
    global _DIAGRAMS
    if _DIAGRAMS is None:
        _DIAGRAMS = {k: str(v) for k, v in render_all().items()}
    return _DIAGRAMS


def _fig(doc, key: str, caption: str, *, width: float = 6.2) -> None:
    add_figure_image(doc, caption, _diagrams()[key], width_inches=width)


def build_all_diagrams(doc) -> None:
    add_heading(doc, "Chapter 4: System Design and Diagrams", 1)
    add_paragraph(
        doc,
        "The following diagrams describe the implemented Corner Store system. They are derived from "
        "ECommerce.Domain entities, ECommerce.Services classes, ECommerce.Presentation controllers, "
        "and frontend/app routes—not from external templates. Figures are rendered as UML-style graphics.",
    )

    _use_case(doc)
    _er_diagram(doc)
    _class_domain(doc)
    _class_services(doc)
    _class_ai(doc)
    _class_frontend(doc)
    _component_deployment(doc)
    _sequence_auth(doc)
    _sequence_cart_order(doc)
    _sequence_stripe(doc)
    _sequence_assistant(doc)
    _sequence_visual_search(doc)
    _sequence_recommendations(doc)
    _activity_checkout(doc)
    _activity_order_status(doc)
    _activity_assistant_tools(doc)
    _activity_rag_reindex(doc)
    _activity_admin_product(doc)
    _package_diagram(doc)
    _state_basket_order(doc)
    add_page_break(doc)


def _use_case(doc) -> None:
    add_heading(doc, "4.1 Use Case Diagram", 2)
    _fig(doc, "fig_4_1", "Figure 4.1: Use cases by actor.", width=6.8)
    add_paragraph(
        doc,
        "Guests access anonymous API routes (Products, Baskets, Recommendations guest paths, Assistant). "
        "Customers require JWT from AuthenticationController. Admins require Admin or SuperAdmin role "
        "on AdminController and KnowledgeController.",
    )


def _er_diagram(doc) -> None:
    add_heading(doc, "4.2 Entity-Relationship Diagram (Store Database)", 2)
    _fig(doc, "fig_4_2", "Figure 4.2: Catalog and order ER model (StoreDbContext).", width=6.8)
    add_heading(doc, "4.3 Entity-Relationship Diagram (Identity Database)", 2)
    _fig(doc, "fig_4_3", "Figure 4.3: Identity model (StoreIdentityDbContext).", width=6.0)
    add_heading(doc, "4.4 Redis Data (non-relational)", 2)
    _fig(doc, "fig_4_4", "Figure 4.4: Redis keys.", width=6.5)


def _class_domain(doc) -> None:
    add_heading(doc, "4.5 Class Diagram — Domain Layer", 2)
    _fig(doc, "fig_4_5", "Figure 4.5: Core domain types (ECommerce.Domain).", width=6.8)


def _class_services(doc) -> None:
    add_heading(doc, "4.6 Class Diagram — Service Layer", 2)
    _fig(doc, "fig_4_6", "Figure 4.6: Services implement abstractions from ECommerce.Services.Abstraction.", width=6.8)


def _class_ai(doc) -> None:
    add_heading(doc, "4.7 Class Diagram — AI Module", 2)
    _fig(doc, "fig_4_7", "Figure 4.7: AI classes (ECommerce.Services.AI).", width=6.5)


def _class_frontend(doc) -> None:
    add_heading(doc, "4.8 Class Diagram — Frontend Structure (logical)", 2)
    _fig(doc, "fig_4_8", "Figure 4.8: Next.js App Router and contexts.", width=6.5)


def _component_deployment(doc) -> None:
    add_heading(doc, "4.9 Component / Deployment Diagram", 2)
    _fig(doc, "fig_4_9", "Figure 4.9: Docker Compose services.", width=6.5)


def _sequence_auth(doc) -> None:
    add_heading(doc, "4.10 Sequence Diagram — Login and JWT", 2)
    _fig(doc, "fig_4_10", "Figure 4.10: AuthenticationController.Login flow.", width=6.5)


def _sequence_cart_order(doc) -> None:
    add_heading(doc, "4.11 Sequence Diagram — Cart to Order", 2)
    _fig(doc, "fig_4_11", "Figure 4.11: OrderService.CreateOrderAsync.", width=6.5)


def _sequence_stripe(doc) -> None:
    add_heading(doc, "4.12 Sequence Diagram — Stripe Payment", 2)
    _fig(doc, "fig_4_12", "Figure 4.12: PaymentService PaymentIntent flow.", width=6.5)


def _sequence_assistant(doc) -> None:
    add_heading(doc, "4.13 Sequence Diagram — Assistant Chat", 2)
    _fig(doc, "fig_4_13", "Figure 4.13: ChatAssistantService.ChatAsync.", width=6.5)


def _sequence_visual_search(doc) -> None:
    add_heading(doc, "4.14 Sequence Diagram — Visual Search", 2)
    _fig(doc, "fig_4_14", "Figure 4.14: VisualSearchService pipeline.", width=6.5)


def _sequence_recommendations(doc) -> None:
    add_heading(doc, "4.15 Sequence Diagram — Co-purchase Recommendations", 2)
    _fig(doc, "fig_4_15", "Figure 4.15: RecommendationService.GetCoPurchasedProductsAsync.", width=6.5)


def _activity_checkout(doc) -> None:
    add_heading(doc, "4.16 Activity Diagram — Checkout", 2)
    _fig(doc, "fig_4_16", "Figure 4.16: checkout-flow.tsx steps.", width=5.5)


def _activity_order_status(doc) -> None:
    add_heading(doc, "4.17 Activity Diagram — Order Status Lifecycle", 2)
    _fig(doc, "fig_4_17", "Figure 4.17: OrderStatus enum transitions (OrderService + PaymentService).", width=6.5)


def _activity_assistant_tools(doc) -> None:
    add_heading(doc, "4.18 Activity Diagram — Assistant Tool Loop", 2)
    _fig(doc, "fig_4_18", "Figure 4.18: ChatAssistantService tool iteration.", width=5.5)


def _activity_rag_reindex(doc) -> None:
    add_heading(doc, "4.19 Activity Diagram — Knowledge Reindex", 2)
    _fig(doc, "fig_4_19", "Figure 4.19: RagService.ReindexAllAsync (admin or startup if enabled).", width=5.5)


def _activity_admin_product(doc) -> None:
    add_heading(doc, "4.20 Activity Diagram — Admin Product Upload", 2)
    _fig(doc, "fig_4_20", "Figure 4.20: Admin product image upload.", width=5.5)


def _package_diagram(doc) -> None:
    add_heading(doc, "4.21 Package Diagram — Backend Solution", 2)
    _fig(doc, "fig_4_21", "Figure 4.21: Project dependencies (Clean Architecture).", width=6.5)


def _state_basket_order(doc) -> None:
    add_heading(doc, "4.22 State Diagram — Basket and Order", 2)
    _fig(doc, "fig_4_22", "Figure 4.22: Basket exists in Redis until order creation or TTL expiry.", width=6.8)


def get_appendix_er_image() -> str:
    """Path to Appendix E ER diagram PNG."""
    return _diagrams()["fig_e_1"]
