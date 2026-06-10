"""Tool catalog, frontend API mapping, controller sections — verified from source."""

from thesis_build import add_bullets, add_heading, add_page_break, add_paragraph, add_table

ASSISTANT_TOOLS = [
    ("searchProducts", "keyword, query, category, brand, minPrice, maxPrice", "ProductService.GetAllProductsAsync + price filter; max 8 results"),
    ("recommendProducts", "category, maxPrice", "GetByBudgetAsync, GetByCategoryAsync, or GetPersonalizedAsync"),
    ("compareProducts", "productIds[] (2–4)", "Loads products; falls back to context CompareIds"),
    ("getSimilarProducts", "productId, count", "RecommendationService.GetSimilarAsync"),
    ("getOrderStatus", "orderId? (substring)", "Requires JWT email; GetAllOrdersAsync"),
    ("getTrendingProducts", "count", "GetTrendingAsync"),
    ("getPersonalizedRecommendations", "(none)", "GetPersonalizedAsync with cart/recent context"),
    ("getStorePolicies", "topic", "RagService.RetrieveAsync top 5"),
    ("getProductCategories", "(none)", "GetAllTypesAsync"),
    ("getReviewSummary", "productId", "ReviewSummaryService.GetSummaryAsync"),
]

CONTROLLERS = [
    (
        "AuthenticationController",
        [
            ("POST /Authentication/Login", "Anonymous", "LoginDTO → JWT + UserDTO"),
            ("POST /Authentication/Register", "Anonymous", "RegisterDTO → user + JWT"),
            ("GET /Authentication/emailExists", "Anonymous", "Query email"),
            ("GET /Authentication/CurrentUser", "JWT", "UserDTO"),
            ("GET/PUT/DELETE /Authentication/Addresses", "JWT", "SavedAddressDTO CRUD"),
            ("GET/PUT /Authentication/Address", "JWT", "Legacy single address"),
        ],
    ),
    (
        "ProductsController",
        [
            ("GET /Products", "Anonymous", "ProductQueryParams; RedisCache 5 min"),
            ("GET /Products/{id}", "Anonymous", "ProductDTO"),
            ("GET /Products/brands", "Anonymous", "BrandDTO[]"),
            ("GET /Products/types", "Anonymous", "TypeDTO[]"),
            ("GET /Products/{id}/recommendations", "Anonymous", "Same-type recommendations"),
            ("GET /Products/{id}/reviews", "Anonymous", "ReviewDTO[]"),
            ("GET /Products/{id}/review-summary", "Anonymous", "ReviewSummaryDTO"),
            ("POST /Products/{id}/reviews", "JWT", "CreateReviewDTO"),
        ],
    ),
    (
        "BasketsController",
        [
            ("GET /Baskets", "Anonymous", "Query basketId"),
            ("POST /Baskets", "Anonymous", "BasketDTO upsert to Redis"),
            ("DELETE /Baskets/{id}", "Anonymous", "Remove basket key"),
        ],
    ),
    (
        "OrdersController",
        [
            ("POST /Orders", "JWT", "OrderDTO → create + stock deduct"),
            ("GET /Orders", "JWT", "User orders list"),
            ("GET /Orders/{id:guid}", "JWT", "Order detail"),
            ("GET /Orders/deliveryMethods", "Anonymous", "DeliveryMethodDTO[]"),
            ("POST /Orders/{id}/cancel", "JWT", "Cancel + stock restore"),
            ("POST /Orders/{id}/return", "JWT", "ReturnOrderDTO"),
            ("POST /Orders/{id}/schedule", "JWT", "ScheduleOrderDTO"),
        ],
    ),
    (
        "PaymentsController",
        [
            ("GET /Payments/stripe-config", "Anonymous", "Publishable key"),
            ("POST /Payments/{BasketId}", "JWT", "PaymentIntent on basket"),
            ("GET /Payments/{BasketId}/payment-status", "JWT", "Poll status"),
            ("POST /Payments/webhook", "Stripe signature", "Webhook events"),
        ],
    ),
    (
        "RecommendationsController",
        [
            ("GET /Recommendations/trending", "Anonymous", "Purchase or review trending"),
            ("GET /Recommendations/similar/{id}", "Anonymous", "Co-purchase + content"),
            ("GET /Recommendations/bought-together/{id}", "Anonymous", "Co-purchase only"),
            ("GET /Recommendations/personalized", "JWT", "Authenticated personalization"),
            ("GET /Recommendations/personalized/guest", "Anonymous", "Cart/recent only"),
            ("GET /Recommendations/for-products", "Anonymous", "Query productIds"),
            ("GET /Recommendations/by-budget", "Anonymous", "Query maxPrice"),
            ("GET /Recommendations/by-category", "Anonymous", "Query category"),
            ("GET /Recommendations/similar-price/{id}", "Anonymous", "Price proximity"),
            ("POST /Recommendations/track-click", "Anonymous", "Click analytics"),
        ],
    ),
    (
        "AssistantController",
        [
            ("GET /Assistant/status", "Anonymous", "AssistantStatusDTO"),
            ("GET /Assistant/sessions/{id}/messages", "Anonymous", "Session history"),
            ("POST /Assistant/chat", "Anonymous", "AssistantChatRequestDTO → response + cards"),
            ("POST /Assistant/visual-search", "Anonymous", "Base64 image → tiered matches"),
        ],
    ),
    (
        "ChatController",
        [("POST /chat", "Anonymous", "Simplified chat alias")],
    ),
    (
        "WishlistsController",
        [
            ("GET /Wishlists", "JWT", "WishlistDTO"),
            ("POST /Wishlists/{productId}", "JWT", "Add product id"),
            ("DELETE /Wishlists/{productId}", "JWT", "Remove one"),
            ("DELETE /Wishlists", "JWT", "Clear all"),
        ],
    ),
    (
        "NotificationsController",
        [
            ("GET /Notifications", "JWT", "NotificationDTO[]"),
            ("GET /Notifications/unread-count", "JWT", "int"),
            ("PUT /Notifications/{id}/read", "JWT", "Mark read"),
            ("PUT /Notifications/read-all", "JWT", "Mark all read"),
        ],
    ),
    (
        "AccountController",
        [("GET /Account/dashboard", "JWT", "AccountDashboardDTO")],
    ),
    (
        "KnowledgeController",
        [
            ("GET/POST/PUT/DELETE /Knowledge", "Admin", "Knowledge document CRUD"),
            ("GET /Knowledge/chunks", "Admin", "Paginated chunks"),
            ("GET /Knowledge/{id}/chunks", "Admin", "Document chunks"),
            ("POST /Knowledge/reindex-all", "Admin", "Full reindex"),
            ("POST /Knowledge/{id}/reindex", "Admin", "Single doc reindex"),
        ],
    ),
    (
        "AdminController",
        [
            ("GET /Admin/stats", "Admin", "Dashboard KPIs"),
            ("GET /Admin/analytics", "Admin", "Chart series"),
            ("GET /Admin/reports", "Admin", "Reports DTO"),
            ("CRUD /Admin/users", "Admin", "User management"),
            ("CRUD /Admin/products", "Admin", "Product CRUD + upload-image"),
            ("GET /Admin/orders", "Admin", "All orders"),
            ("GET/DELETE /Admin/reviews", "Admin", "Moderation"),
            ("GET /Admin/audit-logs", "Admin", "AuditLog[]"),
            ("GET /Admin/ai/*", "Admin", "AI overview, logs, cost, etc."),
            ("GET /Admin/system/health", "Admin", "Health checks"),
        ],
    ),
]

FRONTEND_API_MAP = [
    ("auth.ts", "login, register, getCurrentUser, addresses → /Authentication"),
    ("products.ts", "getProducts, getProductById, brands, types, review-summary → /Products"),
    ("cart.ts", "getBasket, saveBasket, deleteBasket → /Baskets"),
    ("orders.ts", "createOrder, cancel, return, schedule → /Orders"),
    ("payments.ts", "createOrUpdatePaymentIntent → /Payments"),
    ("wishlist.ts", "CRUD → /Wishlists"),
    ("notifications.ts", "list, unread, mark read → /Notifications"),
    ("account.ts", "getAccountDashboard → /Account/dashboard"),
    ("recommendations.ts", "all recommendation modes + track-click"),
    ("assistant.ts", "status, chat, session history → /Assistant"),
    ("visual-search.ts", "searchByImage → /Assistant/visual-search"),
    ("admin.ts", "stats, users, products, orders, reviews, audit"),
    ("admin-ai.ts", "overview, analytics, logs, cost, recommendation/visual analytics"),
    ("knowledge.ts", "document CRUD, reindex → /Knowledge"),
    ("reviews.ts", "getProductReviews, addProductReview"),
]


def build_tools_and_mapping(doc) -> None:
    add_heading(doc, "Chapter 9 (continued): Assistant Tool Parameter Reference", 1)
    add_paragraph(
        doc,
        "Tool definitions are declared in AssistantToolCatalog.All (AssistantToolExecutor.cs) and "
        "registered with Gemini at runtime.",
    )
    add_table(doc, ["Tool", "Parameters", "Backend behavior"], ASSISTANT_TOOLS)

    add_heading(doc, "Chapter 7 (continued): Frontend-to-API Mapping", 1)
    add_table(doc, ["Module", "Backend routes used"], FRONTEND_API_MAP)

    add_heading(doc, "ProductQueryParams (ECommerce.Shared)", 2)
    add_bullets(
        doc,
        [
            "search, brandId, typeId, sort (ProductSortingOptions enum)",
            "PageIndex default 1; PageSize default 5, max 50",
        ],
    )
    add_page_break(doc)


def build_controller_api_sections(doc) -> None:
    add_heading(doc, "Chapter 6: REST API by Controller", 1)
    add_paragraph(doc, "Base path /api. Source: ECommerce.Presentation/Controllers.")
    for controller_name, endpoints in CONTROLLERS:
        add_heading(doc, controller_name, 2)
        add_table(doc, ["Route", "Auth", "Notes"], [[r, a, n] for r, a, n in endpoints])
    add_page_break(doc)


def build_diagram_narratives(doc) -> None:
    add_heading(doc, "Chapter 4 (continued): Diagram Interpretation Notes", 1)
    notes = [
        ("ER and Redis (Figures 4.2–4.4)", "Dual DbContexts; OrderItem.Product is owned snapshot not live FK."),
        ("Domain classes (4.5)", "BaseEntity<TKey>; owned OrderAddress and ProductItemOrdered."),
        ("Services (4.6)", "DI in Program.cs; BasketRepository is Redis-only."),
        ("AI classes (4.7)", "InMemoryVectorStore singleton; ChatAssistantService requires GeminiProvider."),
        ("Deployment (4.9)", "API_INTERNAL_URL for SSR; volume cornerstore-product-images."),
        ("Login (4.10)", "JWT 1 hour from AuthenticationService."),
        ("Order (4.11)", "InsufficientStock error before save if quantity exceeds StockQuantity."),
        ("Stripe (4.12)", "Basket holds PaymentIntentID and ClientSecret."),
        ("Assistant (4.13)", "Invalid/missing GEMINI_API_KEY returns config message without API call."),
        ("Visual search (4.14)", "10 MB max; jpeg/png/webp only."),
        ("Recommendations (4.15)", "Excludes Cancelled and PaymentFailed orders."),
        ("Checkout activity (4.16)", "checkout-flow.tsx + stripe-payment-form.tsx."),
        ("Order status (4.17)", "ReturnWindowDays = 14 in OrderActionRules."),
        ("Tool loop (4.18)", "MaxToolIterations default 3 in AiOptions."),
        ("Reindex (4.19)", "EnableStartupIndexing default false."),
        ("Admin upload (4.20)", "ProductImageStorage → wwwroot/images/products/."),
    ]
    for title, text in notes:
        add_heading(doc, title, 3)
        add_paragraph(doc, text)
    add_page_break(doc)
