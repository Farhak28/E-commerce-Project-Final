"""Render UML-style diagrams as PNG images for thesis embedding."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Circle, Ellipse, Polygon

OUTPUT_DIR = Path(__file__).resolve().parent / "diagram_output"

# Academic UML palette
C_ENTITY = "#D5E8F7"
C_ENTITY_BORDER = "#2C5282"
C_INTERFACE = "#FFF8E1"
C_INTERFACE_BORDER = "#B7791F"
C_ACTOR = "#EDF2F7"
C_SYSTEM = "#F7FAFC"
C_USECASE = "#EBF8FF"
C_ACTION = "#E6FFFA"
C_DECISION = "#FEEBC8"
C_STATE = "#E9D8FD"
C_DEPLOY = "#C6F6D5"
C_TEXT = "#1A202C"
C_ARROW = "#2D3748"
C_LIFELINE = "#A0AEC0"


def _ensure_dir() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR


def _new_fig(w: float, h: float):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax


def _save(fig, name: str) -> Path:
    path = _ensure_dir() / f"{name}.png"
    fig.savefig(path, dpi=180, bbox_inches="tight", facecolor="white", pad_inches=0.15)
    plt.close(fig)
    return path


def _text(ax, x, y, s, size=8, bold=False, ha="center", va="center", color=C_TEXT):
    ax.text(x, y, s, fontsize=size, fontweight="bold" if bold else "normal", ha=ha, va=va, color=color)


def _box(ax, x, y, w, h, title, lines=None, fill=C_ENTITY, border=C_ENTITY_BORDER, title_size=9):
    rect = FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.02,rounding_size=1.2",
        facecolor=fill, edgecolor=border, linewidth=1.4,
    )
    ax.add_patch(rect)
    _text(ax, x + w / 2, y + h - 2.2, title, size=title_size, bold=True)
    if lines:
        body = "\n".join(lines)
        ax.text(x + w / 2, y + h / 2 - 1, body, fontsize=7, ha="center", va="center", color=C_TEXT, linespacing=1.35)


def _interface_box(ax, x, y, w, h, iface, impl):
    _box(ax, x, y, w, h, iface, fill=C_INTERFACE, border=C_INTERFACE_BORDER, title_size=8)
    ax.annotate("", xy=(x + w / 2, y - 1), xytext=(x + w / 2, y - 5),
                arrowprops=dict(arrowstyle="-|>", color=C_ARROW, lw=1.2))
    _box(ax, x - 1, y - 14, w + 2, 8, impl, fill=C_ENTITY, border=C_ENTITY_BORDER, title_size=8)


def _arrow(ax, x1, y1, x2, y2, label=None, style="-|>", dashed=False):
    patch = FancyArrowPatch(
        (x1, y1), (x2, y2), arrowstyle=style, color=C_ARROW,
        linewidth=1.2, linestyle="--" if dashed else "-", mutation_scale=12,
    )
    ax.add_patch(patch)
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 + 1.5
        _text(ax, mx, my, label, size=6.5, ha="center")


def _line(ax, x1, y1, x2, y2, dashed=False):
    ax.plot([x1, x2], [y1, y2], color=C_ARROW, lw=1.1, linestyle="--" if dashed else "-")
    if not dashed:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", color=C_ARROW, lw=0))


def _actor(ax, x, y, name):
    ax.add_patch(Circle((x, y + 5), 2.8, facecolor=C_ACTOR, edgecolor=C_ENTITY_BORDER, lw=1.2))
    ax.plot([x, x], [y + 2.2, y - 3], color=C_ENTITY_BORDER, lw=1.2)
    ax.plot([x - 3.5, x + 3.5], [y + 0.5, y + 0.5], color=C_ENTITY_BORDER, lw=1.2)
    ax.plot([x, x - 3], [y - 3, y - 8], color=C_ENTITY_BORDER, lw=1.2)
    ax.plot([x, x + 3], [y - 3, y - 8], color=C_ENTITY_BORDER, lw=1.2)
    _text(ax, x, y - 11, name, size=8, bold=True)


def _usecase(ax, x, y, w, h, text):
    ax.add_patch(Ellipse((x + w / 2, y + h / 2), w, h, facecolor=C_USECASE, edgecolor=C_ENTITY_BORDER, lw=1.1))
    ax.text(x + w / 2, y + h / 2, text, fontsize=6.5, ha="center", va="center", color=C_TEXT, wrap=True)


def _system_boundary(ax, x, y, w, h, label):
    rect = FancyBboxPatch(
        (x, y), w, h, boxstyle="square,pad=0", facecolor=C_SYSTEM,
        edgecolor="#718096", linewidth=1.5, linestyle="--",
    )
    ax.add_patch(rect)
    _text(ax, x + w / 2, y + h + 2, label, size=10, bold=True)


def _lifeline(ax, x, y0, y1, name):
    _box(ax, x - 6, y1 + 1, 12, 6, name, fill="#FFFFFF", border=C_ENTITY_BORDER, title_size=7)
    ax.plot([x, x], [y0, y1], color=C_LIFELINE, lw=1, linestyle="--")


def _seq_msg(ax, x1, x2, y, label, ret=False):
    style = "-|>" if not ret else "-|>"
    ls = "--" if ret else "-"
    ax.annotate("", xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle=style, color=C_ARROW, lw=1.1, linestyle=ls))
    _text(ax, (x1 + x2) / 2, y + 1.8, label, size=6.5)


def _oval_action(ax, x, y, w, h, text):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.02,rounding_size=2",
        facecolor=C_ACTION, edgecolor="#319795", linewidth=1.2,
    ))
    ax.text(x + w / 2, y + h / 2, text, fontsize=7, ha="center", va="center", color=C_TEXT)


def _diamond(ax, cx, cy, size, text):
    pts = [(cx, cy + size), (cx + size * 1.4, cy), (cx, cy - size), (cx - size * 1.4, cy)]
    ax.add_patch(Polygon(pts, closed=True, facecolor=C_DECISION, edgecolor="#DD6B20", lw=1.2))
    ax.text(cx, cy, text, fontsize=6.5, ha="center", va="center", color=C_TEXT)


def _state(ax, x, y, w, h, text):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.02,rounding_size=3",
        facecolor=C_STATE, edgecolor="#6B46C1", linewidth=1.3,
    ))
    ax.text(x + w / 2, y + h / 2, text, fontsize=7, ha="center", va="center", color=C_TEXT)


def _start_end(ax, x, y, start=True):
    if start:
        ax.add_patch(Circle((x, y), 2.5, facecolor=C_TEXT, edgecolor=C_TEXT))
        ax.add_patch(Circle((x, y), 1.6, facecolor="white", edgecolor="white"))
    else:
        ax.add_patch(Circle((x, y), 2.5, facecolor="white", edgecolor=C_TEXT, lw=2))


def render_use_case() -> Path:
    fig, ax = _new_fig(14, 10)
    _system_boundary(ax, 22, 8, 56, 78, "Corner Store System")
    cases = [
        (26, 68, 22, 8, "Browse catalog\n& search"),
        (50, 68, 22, 8, "Cart & checkout\n(COD/InstaPay)"),
        (26, 54, 22, 8, "AI assistant\n& visual search"),
        (50, 54, 22, 8, "Recommendations\n(trending/similar)"),
        (26, 38, 22, 8, "Register / login\nJWT session"),
        (50, 38, 22, 8, "Orders: cancel\nreturn / schedule"),
        (26, 22, 22, 8, "Admin: products\norders / users"),
        (50, 22, 22, 8, "AI admin:\nknowledge / logs"),
    ]
    for x, y, w, h, t in cases:
        _usecase(ax, x, y, w, h, t)
    _actor(ax, 8, 55, "Guest")
    _actor(ax, 8, 35, "Customer")
    _actor(ax, 8, 15, "Admin")
    _actor(ax, 92, 45, "Stripe /\nGemini")
    for ax_x in (8, 8, 8, 92):
        pass
    _line(ax, 14, 55, 22, 60)
    _line(ax, 14, 35, 22, 42)
    _line(ax, 14, 15, 22, 26)
    _line(ax, 86, 45, 78, 50)
    return _save(fig, "fig_4_1_use_case")


def render_er_store() -> Path:
    fig, ax = _new_fig(14, 9)
    _box(ax, 5, 78, 18, 12, "ProductBrand", ["Id PK", "Name"])
    _box(ax, 30, 78, 22, 14, "Product", ["Id PK", "Name, Price", "StockQuantity", "FK Brand, Type"])
    _box(ax, 58, 78, 18, 12, "ProductType", ["Id PK", "Name"])
    _box(ax, 30, 58, 18, 10, "Review", ["Id PK", "ProductId FK", "Rating, Comment"])
    _box(ax, 5, 38, 20, 12, "DeliveryMethod", ["Id PK", "ShortName", "Price"])
    _box(ax, 30, 35, 22, 14, "Order", ["Id Guid PK", "UserEmail", "Status", "SubTotal"])
    _box(ax, 58, 35, 22, 14, "OrderItem", ["Id PK", "OrderId FK", "Price, Qty", "«owned» ProductItemOrdered"])
    _box(ax, 5, 12, 22, 14, "KnowledgeDocument", ["Id PK", "Title, Content", "Category"])
    _box(ax, 32, 12, 20, 12, "KnowledgeChunk", ["Id PK", "DocumentId FK", "EmbeddingJson"])
    _box(ax, 58, 12, 20, 12, "ChatSession", ["Id Guid PK", "UserEmail"])
    _box(ax, 82, 12, 16, 12, "ChatMessage", ["Id PK", "SessionId FK"])
    _arrow(ax, 23, 84, 30, 84, "1:N")
    _arrow(ax, 52, 84, 58, 84, "N:1")
    _arrow(ax, 41, 78, 41, 68, "1:N")
    _arrow(ax, 25, 44, 30, 42, "1:N")
    _arrow(ax, 52, 42, 58, 42, "1:N")
    _arrow(ax, 27, 19, 32, 19, "1:N")
    _arrow(ax, 52, 19, 58, 19, "1:N")
    _text(ax, 50, 5, "Standalone: Notification, AssistantInteractionLog, VisualSearchEvent, RecommendationEvent, AuditLog",
          size=7, ha="center")
    return _save(fig, "fig_4_2_er_store")


def render_er_identity() -> Path:
    fig, ax = _new_fig(10, 6)
    _box(ax, 10, 55, 28, 18, "ApplicationUser", ["Id PK (string)", "DisplayName", "Email, PasswordHash"])
    _box(ax, 50, 55, 22, 14, "Address", ["Id PK", "UserId FK", "Street, City, Country"])
    _box(ax, 10, 25, 24, 12, "IdentityRole", ["Id, Name"])
    _box(ax, 42, 22, 30, 16, "AspNetUserRoles", ["UserId FK", "RoleId FK"])
    _text(ax, 50, 8, "AspNetUserClaims, AspNetUserLogins, AspNetUserTokens → Users", size=7.5)
    _arrow(ax, 38, 64, 50, 64, "1:N")
    _arrow(ax, 34, 55, 42, 38, "M:N")
    _arrow(ax, 24, 55, 24, 37, "")
    return _save(fig, "fig_4_3_er_identity")


def render_redis() -> Path:
    fig, ax = _new_fig(10, 5)
    _box(ax, 8, 55, 38, 16, "{basketId}", ["CustomerBasket JSON", "Items[], DeliveryMethodId", "PaymentIntentID", "TTL: 7 days"])
    _box(ax, 54, 55, 38, 14, "wishlist:{email}", ["productIds: int[]", "TTL: 30 days"])
    _box(ax, 8, 28, 84, 14, "[cache keys]", ["Product list responses", "RedisCache attribute — 5 min TTL"])
    ax.add_patch(FancyBboxPatch((5, 20), 90, 58, boxstyle="round,pad=0.3", facecolor="#FFF5F5",
                                 edgecolor="#C53030", linewidth=1.5, linestyle="--"))
    _text(ax, 50, 82, "Redis 7 (non-relational)", size=11, bold=True)
    return _save(fig, "fig_4_4_redis")


def render_class_domain() -> Path:
    fig, ax = _new_fig(14, 10)
    _box(ax, 38, 88, 24, 8, "«abstract» BaseEntity<TKey>", ["+ Id : TKey"], fill=C_INTERFACE, border=C_INTERFACE_BORDER)
    _box(ax, 5, 68, 28, 16, "Product", ["+ Name, Price, StockQty", "+ ProductBrandId, TypeId", "+ Reviews[]"])
    _box(ax, 38, 68, 26, 16, "Order", ["+ UserEmail, Status", "+ PaymentMethod", "+ Address «owned»", "+ Items[]"])
    _box(ax, 70, 68, 26, 14, "OrderItem", ["+ Product «owned»", "+ Price, Quantity"])
    _box(ax, 5, 42, 24, 12, "ProductBrand / ProductType", ["+ Name"])
    _box(ax, 33, 42, 24, 12, "KnowledgeDocument", ["+ Title, Content", "+ Chunks[]"])
    _box(ax, 61, 42, 24, 12, "ChatSession", ["+ Messages[]"])
    _box(ax, 5, 18, 90, 14, "Analytics & support entities", [
        "Review, Notification, AssistantInteractionLog",
        "VisualSearchEvent, RecommendationEvent, AuditLog",
        "CustomerBasket (Redis) + BasketItem[]",
        "ApplicationUser : IdentityUser + DisplayName",
    ])
    _arrow(ax, 50, 88, 19, 84)
    _arrow(ax, 50, 88, 51, 84)
    _arrow(ax, 51, 68, 83, 68, "1:N")
    return _save(fig, "fig_4_5_class_domain")


def render_class_services() -> Path:
    fig, ax = _new_fig(14, 11)
    pairs = [
        ("IProductService", "ProductService", 3, 88),
        ("IOrderService", "OrderService", 28, 88),
        ("IPaymentService", "PaymentService", 53, 88),
        ("IAuthenticationService", "AuthenticationService", 78, 88),
        ("IRecommendationService", "RecommendationService", 3, 68),
        ("INotificationService", "NotificationService", 28, 68),
        ("IAdminService", "AdminService", 53, 68),
        ("IAdminAiService", "AdminAiService", 78, 68),
        ("IWishlistService", "WishlistService", 3, 48),
        ("ICacheService", "CacheService", 28, 48),
        ("IAccountService", "AccountService", 53, 48),
        ("IAuditLogService", "AuditLogService", 78, 48),
    ]
    for iface, impl, x, y in pairs:
        _interface_box(ax, x, y, 22, 7, f"«interface»\n{iface}", impl)
    _box(ax, 15, 22, 70, 14, "Infrastructure contracts", [
        "IUnitOfWork + IGenericRepository<T>  (ECommerce.Domain.Contracts)",
        "IBasketRepository  (Redis — ECommerce.Persistence)",
        "IRecommendationTrackingService → RecommendationTrackingService",
        "IInventoryStockService → InventoryStockService",
    ])
    return _save(fig, "fig_4_6_class_services")


def render_class_ai() -> Path:
    fig, ax = _new_fig(12, 9)
    pairs = [
        ("IAIProvider", "GeminiProvider", 5, 78),
        ("IRagService", "RagService", 38, 78),
        ("IChatAssistantService", "ChatAssistantService", 71, 78),
        ("IAssistantToolExecutor", "AssistantToolExecutor", 5, 58),
        ("IVisualSearchService", "VisualSearchService", 38, 58),
        ("IReviewSummaryService", "ReviewSummaryService", 71, 58),
        ("IKnowledgeService", "KnowledgeService", 5, 38),
        ("IVectorStore", "InMemoryVectorStore", 38, 38),
    ]
    for iface, impl, x, y in pairs:
        _interface_box(ax, x, y, 28, 7, f"«interface»\n{iface}", impl)
    _box(ax, 10, 12, 80, 16, "Supporting AI classes", [
        "VisualProductMatcher — rule-based scoring (85 / 55 / 25 tiers)",
        "AiOptions — configuration (model, chunk size, TopK, MaxToolIterations)",
        "AiKnowledgeSeeder — seven policy documents on startup",
    ])
    return _save(fig, "fig_4_7_class_ai")


def render_class_frontend() -> Path:
    fig, ax = _new_fig(11, 7)
    _box(ax, 35, 78, 30, 10, "app/ (pages)", ["Next.js App Router routes"])
    _box(ax, 8, 58, 28, 12, "components/", ["UI: product-card, checkout-flow", "assistant-cards, admin-shell"])
    _box(ax, 42, 58, 28, 12, "lib/services/", ["api-client, products, orders", "assistant, recommendations"])
    _box(ax, 76, 58, 20, 12, "lib/chatbot/", ["assistant-client", "assistant-logic (fallback)"])
    _box(ax, 8, 32, 88, 18, "React Context Providers", [
        "AuthContext — JWT session",
        "CartContext — Redis basketId",
        "WishlistContext, CompareContext (max 4)",
        "AssistantContext — chat + visual search",
        "ThemeProvider — dark mode, EN/AR i18n",
    ])
    _arrow(ax, 50, 78, 22, 70)
    _arrow(ax, 50, 78, 56, 70)
    _arrow(ax, 50, 78, 86, 70)
    return _save(fig, "fig_4_8_class_frontend")


def render_deployment() -> Path:
    fig, ax = _new_fig(11, 8)
    _box(ax, 40, 82, 20, 10, "Browser", ["User"], fill="#FFFFFF")
    _box(ax, 30, 58, 40, 14, "frontend :3848", ["Next.js container", "NEXT_PUBLIC_API_URL"])
    _box(ax, 25, 32, 50, 16, "backend :5141", ["ASP.NET Core API", "API_INTERNAL_URL (SSR)"])
    _box(ax, 5, 8, 22, 14, "SQL Server :1433", ["ECommerceDBOnline", "+ .Security"])
    _box(ax, 30, 8, 18, 14, "Redis :6379", ["Baskets, wishlists", "Response cache"])
    _box(ax, 52, 8, 20, 14, "Google Gemini", ["LLM + embeddings"])
    _box(ax, 76, 8, 20, 14, "Stripe API", ["PaymentIntent"])
    _arrow(ax, 50, 82, 50, 72)
    _arrow(ax, 50, 58, 50, 48, "HTTP /api")
    _arrow(ax, 35, 32, 16, 22)
    _arrow(ax, 45, 32, 39, 22)
    _arrow(ax, 60, 32, 62, 22)
    _arrow(ax, 70, 32, 86, 22)
    _text(ax, 50, 26, "Volume: cornerstore-product-images → /app/wwwroot/images/products/", size=7)
    return _save(fig, "fig_4_9_deployment")


def _render_sequence(name: str, actors: list[str], messages: list[tuple[int, int, str, bool]]) -> Path:
    fig, ax = _new_fig(12, max(6, len(messages) * 0.45 + 2))
    n = len(actors)
    xs = [10 + i * (80 / max(n - 1, 1)) for i in range(n)]
    y_top, y_bot = 92, 8
    step = (y_top - y_bot - 10) / max(len(messages), 1)
    y = y_top - 5
    for x, actor in zip(xs, actors):
        _lifeline(ax, x, y_bot, y_top, actor)
    for i, (a1, a2, label, ret) in enumerate(messages):
        _seq_msg(ax, xs[a1], xs[a2], y - i * step, label, ret=ret)
    return _save(fig, name)


def render_sequence_auth() -> Path:
    return _render_sequence("fig_4_10_sequence_auth",
        ["User", "Frontend", "API", "AuthService", "Identity"],
        [(0, 1, "email / password", False), (1, 2, "POST /Authentication/Login", False),
         (2, 3, "LoginAsync", False), (3, 4, "CheckPasswordAsync", False),
         (3, 3, "GenerateJwtToken (1h)", False), (2, 1, "token + UserDTO", True),
         (1, 1, "save JWT localStorage", False), (1, 2, "Bearer on protected routes", False)])


def render_sequence_cart_order() -> Path:
    return _render_sequence("fig_4_11_sequence_order",
        ["User", "Frontend", "API", "OrderService", "Redis", "DB"],
        [(0, 1, "checkout", False), (1, 2, "POST /Orders + JWT", False),
         (2, 3, "CreateOrderAsync", False), (3, 4, "GetBasketAsync", False),
         (3, 5, "validate stock, save Order", False), (3, 5, "deduct StockQuantity", False),
         (3, 4, "delete basket", False), (2, 1, "OrderToReturnDTO", True)])


def render_sequence_stripe() -> Path:
    return _render_sequence("fig_4_12_sequence_stripe",
        ["Frontend", "API", "PaymentSvc", "Stripe", "Webhook"],
        [(0, 1, "GET /Payments/stripe-config", False), (0, 1, "POST /Payments/{BasketId}", False),
         (1, 2, "CreatePaymentIntentAsync", False), (2, 3, "PaymentIntent.create", False),
         (1, 0, "clientSecret", True), (0, 3, "confirmCardPayment", False),
         (3, 4, "POST /Payments/webhook", False), (4, 2, "update Order.Status", False)])


def render_sequence_assistant() -> Path:
    return _render_sequence("fig_4_13_sequence_assistant",
        ["User", "API", "ChatAsst", "RAG", "Gemini", "Tools"],
        [(0, 1, "POST /Assistant/chat", False), (1, 2, "ChatAsync", False),
         (2, 3, "RetrieveAsync (embed+search)", False), (2, 4, "GenerateWithContentsAsync", False),
         (4, 5, "ExecuteAsync (tool loop ≤3)", False), (5, 4, "tool result JSON", True),
         (2, 2, "save InteractionLog", False), (1, 0, "text + product cards", True)])


def render_sequence_visual_search() -> Path:
    return _render_sequence("fig_4_14_sequence_visual",
        ["User", "API", "VisualSvc", "Gemini", "Matcher", "DB"],
        [(0, 1, "POST /visual-search (base64)", False), (1, 2, "SearchAsync", False),
         (2, 3, "AnalyzeImageAsync", False), (2, 2, "load catalog", False),
         (2, 4, "Match (score tiers)", False), (2, 5, "save VisualSearchEvent", False),
         (1, 0, "exact / similar / alternative", True)])


def render_sequence_recommendations() -> Path:
    return _render_sequence("fig_4_15_sequence_reco",
        ["Client", "API", "RecoSvc", "DB", "Tracking"],
        [(0, 1, "GET /bought-together/{id}", False), (1, 2, "GetBoughtTogetherAsync", False),
         (2, 3, "LoadOrderLinesAsync", False), (2, 3, "aggregate co-purchase", False),
         (2, 4, "RecommendationEvent", False), (1, 0, "ProductDTO[]", True),
         (0, 1, "POST /track-click", False)])


def render_activity_checkout() -> Path:
    fig, ax = _new_fig(8, 10)
    y = 92
    _start_end(ax, 50, y, start=True)
    steps = ["Review cart items", "Select shipping address", "Choose delivery method",
             "Choose payment method", "Stripe confirm (Card/ApplePay)", "POST /Orders", "Show confirmation"]
    prev_y = y - 4
    for step in steps:
        y -= 10
        _oval_action(ax, 28, y - 4, 44, 8, step)
        _arrow(ax, 50, prev_y - 2.5, 50, y + 4)
        prev_y = y
    y -= 10
    _start_end(ax, 50, y, start=False)
    _arrow(ax, 50, prev_y - 2.5, 50, y + 2.5)
    return _save(fig, "fig_4_16_activity_checkout")


def render_activity_order_status() -> Path:
    fig, ax = _new_fig(10, 8)
    _state(ax, 8, 70, 22, 10, "Pending")
    _state(ax, 40, 70, 28, 10, "PaymentReceived")
    _state(ax, 75, 70, 22, 10, "PaymentFailed")
    _state(ax, 8, 40, 22, 10, "Cancelled")
    _state(ax, 40, 40, 28, 10, "ReturnRequested")
    _state(ax, 75, 40, 22, 10, "Returned")
    _arrow(ax, 30, 75, 40, 75, "payment OK")
    _arrow(ax, 30, 75, 75, 75, "payment fail")
    _arrow(ax, 19, 70, 19, 50, "cancel")
    _arrow(ax, 54, 70, 54, 50, "return (14d)")
    _arrow(ax, 86, 45, 75, 45, "")
    _text(ax, 50, 88, "Order Status Lifecycle", size=11, bold=True)
    return _save(fig, "fig_4_17_activity_order")


def render_activity_assistant_tools() -> Path:
    fig, ax = _new_fig(9, 10)
    y = 90
    _start_end(ax, 50, y, True)
    actions = ["RAG retrieve top-K", "Build system prompt", "Call Gemini + tools"]
    prev = y - 3
    for a in actions:
        y -= 12
        _oval_action(ax, 25, y - 4, 50, 8, a)
        _arrow(ax, 50, prev - 2, 50, y + 4)
        prev = y
    y -= 14
    _diamond(ax, 50, y, 5, "Tool\ncall?")
    _arrow(ax, 50, prev - 2, 50, y + 5)
    _oval_action(ax, 10, y - 18, 32, 8, "ToolExecutor\nExecuteAsync")
    _oval_action(ax, 58, y - 18, 32, 8, "Final NL\nresponse")
    _arrow(ax, 42, y, 26, y - 10, "yes")
    _arrow(ax, 58, y, 74, y - 10, "no")
    y -= 32
    _start_end(ax, 50, y, False)
    _oval_action(ax, 30, y + 10, 40, 7, "Persist InteractionLog")
    return _save(fig, "fig_4_18_activity_assistant")


def render_activity_rag_reindex() -> Path:
    fig, ax = _new_fig(8, 9)
    y = 88
    _start_end(ax, 50, y, True)
    steps = ["POST /Knowledge/reindex-all", "For each KnowledgeDocument",
             "Delete old Chunks", "ChunkText (800, overlap 100)",
             "EmbedAsync per chunk", "Update InMemoryVectorStore"]
    prev = y - 3
    for s in steps:
        y -= 11
        _oval_action(ax, 18, y - 4, 64, 8, s)
        _arrow(ax, 50, prev - 2, 50, y + 4)
        prev = y
    y -= 8
    _start_end(ax, 50, y, False)
    _arrow(ax, 50, prev - 2, 50, y + 2.5)
    return _save(fig, "fig_4_19_activity_rag")


def render_activity_admin_product() -> Path:
    fig, ax = _new_fig(8, 8)
    y = 88
    _start_end(ax, 50, y, True)
    steps = ["Admin selects image", "POST upload-image (multipart)",
             "ProductImageStorage → wwwroot/images/products/{guid}",
             "Return URL path", "Save product PictureUrl", "AuditLogService record"]
    prev = y - 3
    for s in steps:
        y -= 11
        _oval_action(ax, 12, y - 4, 76, 8, s)
        _arrow(ax, 50, prev - 2, 50, y + 4)
        prev = y
    y -= 8
    _start_end(ax, 50, y, False)
    _arrow(ax, 50, prev - 2, 50, y + 2.5)
    return _save(fig, "fig_4_20_activity_admin")


def render_package() -> Path:
    fig, ax = _new_fig(11, 8)
    layers = [
        ("CornerStore.Api", 35, 82, 30, 8, C_DEPLOY, "#276749"),
        ("ECommerce.Presentation", 8, 62, 36, 8, C_ENTITY, C_ENTITY_BORDER),
        ("ECommerce.Services", 8, 46, 36, 8, C_ENTITY, C_ENTITY_BORDER),
        ("ECommerce.Persistence", 8, 30, 36, 8, C_ENTITY, C_ENTITY_BORDER),
        ("ECommerce.Domain", 8, 14, 36, 8, C_INTERFACE, C_INTERFACE_BORDER),
        ("ECommerce.Services.Abstraction", 52, 54, 40, 8, C_INTERFACE, C_INTERFACE_BORDER),
        ("ECommerce.Shared (DTOs)", 52, 38, 40, 8, "#FAF089", "#975A16"),
    ]
    for title, x, y, w, h, fill, border in layers:
        _box(ax, x, y, w, h, title, fill=fill, border=border)
    _text(ax, 72, 18, "External: SQL Server, Redis,\nStripe.net, HttpClient (Gemini)", size=8)
    _arrow(ax, 26, 62, 26, 54)
    _arrow(ax, 26, 46, 26, 38)
    _arrow(ax, 26, 30, 26, 22)
    _arrow(ax, 44, 50, 52, 58)
    _arrow(ax, 50, 82, 50, 70)
    return _save(fig, "fig_4_21_package")


def render_state_basket_order() -> Path:
    fig, ax = _new_fig(12, 9)
    _text(ax, 25, 95, "Basket (Redis)", size=10, bold=True)
    _text(ax, 75, 95, "Order (SQL)", size=10, bold=True)
    basket_states = [(8, 75, "empty"), (8, 58, "has items"), (8, 41, "delivery set"), (8, 24, "PaymentIntent")]
    for x, y, t in basket_states:
        _state(ax, x, y, 30, 10, f"Basket: {t}")
    for y1, y2 in [(75, 58), (58, 41), (41, 24)]:
        _arrow(ax, 23, y1, 23, y2 + 10)
    _state(ax, 8, 8, 30, 10, "deleted / expired")
    _arrow(ax, 23, 24, 23, 18, "order / TTL")
    order_states = [(55, 75, "Pending"), (55, 58, "PaymentReceived"), (55, 41, "PaymentFailed"), (55, 24, "Cancelled")]
    for x, y, t in order_states:
        _state(ax, x, y, 32, 10, t)
    _state(ax, 70, 58, 28, 10, "ReturnRequested")
    _state(ax, 70, 41, 28, 10, "Returned")
    _arrow(ax, 71, 75, 71, 68, "webhook OK")
    _arrow(ax, 79, 75, 79, 68, "fail")
    _arrow(ax, 71, 58, 84, 58, "return")
    _arrow(ax, 84, 58, 84, 51, "")
    return _save(fig, "fig_4_22_state")


def render_er_appendix() -> Path:
    fig, ax = _new_fig(14, 9)
    _box(ax, 5, 78, 18, 12, "ProductBrand", ["Id PK", "Name"])
    _box(ax, 30, 78, 22, 14, "Product", ["Id PK", "Name, Price", "StockQuantity", "FK Brand, Type"])
    _box(ax, 58, 78, 18, 12, "ProductType", ["Id PK", "Name"])
    _box(ax, 30, 58, 18, 10, "Review", ["Id PK", "ProductId FK", "Rating, Comment"])
    _box(ax, 5, 38, 20, 12, "DeliveryMethod", ["Id PK", "ShortName", "Price"])
    _box(ax, 30, 35, 22, 14, "Order", ["Id Guid PK", "UserEmail", "Status", "SubTotal"])
    _box(ax, 58, 35, 22, 14, "OrderItem", ["Id PK", "OrderId FK", "Price, Qty", "«owned» ProductItemOrdered"])
    _box(ax, 5, 12, 22, 14, "KnowledgeDocument", ["Id PK", "Title, Content", "Category"])
    _box(ax, 32, 12, 20, 12, "KnowledgeChunk", ["Id PK", "DocumentId FK", "EmbeddingJson"])
    _box(ax, 58, 12, 20, 12, "ChatSession", ["Id Guid PK", "UserEmail"])
    _box(ax, 82, 12, 16, 12, "ChatMessage", ["Id PK", "SessionId FK"])
    _arrow(ax, 23, 84, 30, 84, "1:N")
    _arrow(ax, 52, 84, 58, 84, "N:1")
    _arrow(ax, 41, 78, 41, 68, "1:N")
    _arrow(ax, 25, 44, 30, 42, "1:N")
    _arrow(ax, 52, 42, 58, 42, "1:N")
    _arrow(ax, 27, 19, 32, 19, "1:N")
    _arrow(ax, 52, 19, 58, 19, "1:N")
    _text(ax, 50, 5, "Standalone: Notification, AssistantInteractionLog, VisualSearchEvent, RecommendationEvent, AuditLog",
          size=7, ha="center")
    return _save(fig, "fig_e_1_er_store")


def render_all() -> dict[str, Path]:
    """Generate all diagram PNGs; returns figure_id → path."""
    return {
        "fig_4_1": render_use_case(),
        "fig_4_2": render_er_store(),
        "fig_4_3": render_er_identity(),
        "fig_4_4": render_redis(),
        "fig_4_5": render_class_domain(),
        "fig_4_6": render_class_services(),
        "fig_4_7": render_class_ai(),
        "fig_4_8": render_class_frontend(),
        "fig_4_9": render_deployment(),
        "fig_4_10": render_sequence_auth(),
        "fig_4_11": render_sequence_cart_order(),
        "fig_4_12": render_sequence_stripe(),
        "fig_4_13": render_sequence_assistant(),
        "fig_4_14": render_sequence_visual_search(),
        "fig_4_15": render_sequence_recommendations(),
        "fig_4_16": render_activity_checkout(),
        "fig_4_17": render_activity_order_status(),
        "fig_4_18": render_activity_assistant_tools(),
        "fig_4_19": render_activity_rag_reindex(),
        "fig_4_20": render_activity_admin_product(),
        "fig_4_21": render_package(),
        "fig_4_22": render_state_basket_order(),
        "fig_e_1": render_er_appendix(),
    }


if __name__ == "__main__":
    paths = render_all()
    for k, p in paths.items():
        print(f"{k}: {p}")
