"""Extended verified content: entities, API, frontend, services — each item documented once."""

from thesis_build import add_bullets, add_heading, add_numbered, add_page_break, add_paragraph, add_table


# --- Data from source code (single source of truth) ---

ENTITIES: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "Product (Products table)",
        [
            ("Id", "int, PK, identity"),
            ("Name", "string, max 200"),
            ("Description", "string, max 500"),
            ("PictureUrl", "string, max 200 — served from wwwroot/images/products/"),
            ("Price", "decimal(18,2)"),
            ("StockQuantity", "int, default 100"),
            ("ProductBrandId", "FK → ProductBrand"),
            ("ProductTypeId", "FK → ProductType"),
        ],
    ),
    (
        "ProductBrand / ProductType",
        [("Id", "int, PK"), ("Name", "string")],
    ),
    (
        "Review (Reviews table)",
        [
            ("Id", "int, PK"),
            ("ProductId", "FK → Product, cascade delete"),
            ("UserName", "string"),
            ("Rating", "int (1–5)"),
            ("Comment", "string"),
            ("CreatedAt", "DateTime"),
        ],
    ),
    (
        "Order (Order table)",
        [
            ("Id", "Guid, PK"),
            ("UserEmail", "string — links to user by email, no FK"),
            ("OrderDate", "DateTimeOffset"),
            ("Status", "OrderStatus enum: Pending, PaymentReceived, PaymentFailed, Cancelled, ReturnRequested, Returned"),
            ("PaymentMethod", "OrderPaymentMethod: Card, ApplePay, InstaPay, CashOnDelivery"),
            ("PaymentIntentId", "string — Stripe reference"),
            ("SubTotal", "decimal(8,2)"),
            ("StockDeducted", "bool — inventory reconciliation flag"),
            ("ScheduledDeliveryAt", "DateTimeOffset?"),
            ("CancelledAt", "DateTimeOffset?"),
            ("ReturnRequestedAt", "DateTimeOffset?"),
            ("ReturnReason", "string?"),
            ("DeliveryMethodId", "FK → DeliveryMethod"),
            ("Address", "owned OrderAddress: FirstName, LastName, Street, City, Country"),
        ],
    ),
    (
        "OrderItem (OrderItem table)",
        [
            ("Id", "int, PK"),
            ("OrderId", "FK → Order"),
            ("Price", "decimal(8,2)"),
            ("Quantity", "int"),
            ("Product", "owned ProductItemOrdered: ProductId, ProductName, PictureUrl"),
        ],
    ),
    (
        "DeliveryMethod",
        [("Id", "int, PK"), ("ShortName", "string"), ("Description", "string"), ("DeliveryTime", "string"), ("Price", "decimal(8,2)")],
    ),
    (
        "CustomerBasket (Redis JSON, not EF)",
        [
            ("Id", "string — Redis key, client GUID"),
            ("Items", "BasketItem[]: Id, ProductName, PictureUrl, Price, Quantity"),
            ("DeliveryMethodId", "int?"),
            ("ShippingPrice", "decimal"),
            ("PaymentIntentID", "string?"),
            ("ClientSecret", "string?"),
            ("TTL", "7 days — BasketRepository default"),
        ],
    ),
    (
        "ApplicationUser (Identity DB, Users table)",
        [
            ("Id", "string, PK"),
            ("DisplayName", "string — custom field"),
            ("Email, UserName, PasswordHash", "ASP.NET Identity standard fields"),
            ("Addresses", "collection → Address"),
        ],
    ),
    (
        "Address (Identity DB)",
        [
            ("Id", "int, PK"),
            ("UserId", "FK → ApplicationUser, cascade delete"),
            ("Name", "string, max 50 — label e.g. Home"),
            ("FirstName, LastName, Street, City, Country", "string"),
        ],
    ),
    (
        "Notification",
        [
            ("Id", "int, PK"),
            ("UserEmail", "string, max 256"),
            ("Title", "max 200"), ("Body", "max 2000"),
            ("IsRead", "bool"), ("Category", "string, default general"),
            ("CreatedAt", "DateTime"),
        ],
    ),
    (
        "KnowledgeDocument / KnowledgeChunk",
        [
            ("Document", "Id, Title, Content, Category, CreatedAt, UpdatedAt"),
            ("Chunk", "Id, DocumentId FK, ChunkIndex, Text, EmbeddingJson, CreatedAt"),
        ],
    ),
    (
        "ChatSession / ChatMessage",
        [
            ("Session", "Id Guid PK, UserEmail?, CreatedAt, UpdatedAt"),
            ("Message", "Id long PK, SessionId FK, Role, Content, CreatedAt"),
        ],
    ),
    (
        "AssistantInteractionLog",
        [
            ("Id", "long, PK"),
            ("SessionId", "Guid? — no FK constraint"),
            ("UserPrompt, AssistantResponse", "string"),
            ("RetrievedChunks, ToolCalls, ToolResponses", "string? JSON"),
            ("LatencyMs", "int"), ("PromptTokens, ResponseTokens", "int?"),
            ("CreatedAt", "DateTime"),
        ],
    ),
    (
        "VisualSearchEvent",
        [
            ("DetectedCategory", "string"), ("DetectedBrand", "string?"),
            ("ExactMatchFound", "bool"), ("MatchCount", "int"),
            ("AttributesJson", "string"), ("LatencyMs", "int"),
        ],
    ),
    (
        "RecommendationEvent",
        [
            ("Source", "string — e.g. trending, bought-together"),
            ("EventType", "impression or click"),
            ("ProductIdsJson", "JSON int array"),
            ("ClickedProductId", "int?"), ("UserEmail", "string?"),
        ],
    ),
    (
        "AuditLog",
        [
            ("ActorEmail", "string"), ("Action", "string"),
            ("EntityType", "string"), ("EntityId", "string?"),
            ("Details", "string?"), ("CreatedAt", "DateTime"),
        ],
    ),
]

FRONTEND_PAGES: list[tuple[str, str]] = [
    ("/", "home-showcase.tsx — featured products, personalized and recent recommendation sections."),
    ("/products", "products-catalog.tsx — search, filters, pagination."),
    ("/products/[id]", "Server product detail: ProductGallery, ProductPurchaseActions, ProductAiInsights, ProductDetailsTabs, three RecommendedProducts carousels (bought-together, similar-price, for-products)."),
    ("/categories", "Category index."),
    ("/categories/[category]", "Filtered listing by category slug."),
    ("/cart", "Cart lines, delivery, RecommendedProducts mode=cart."),
    ("/checkout", "checkout-flow.tsx — address, delivery, payment, stripe-payment-form."),
    ("/login", "Login form; JWT stored via auth-context."),
    ("/register", "Registration with emailExists check."),
    ("/wishlist", "Wishlist grid from wishlist-context."),
    ("/compare", "product-comparison-table.tsx — max 4 from compare-context."),
    ("/notifications", "Notification list and read actions."),
    ("/visual-search", "Image upload; visual-search-cards.tsx for tiered results."),
    ("/help", "Full-page assistant UI."),
    ("/account/dashboard", "Loyalty, points, profile completion from GET /Account/dashboard."),
    ("/account/orders", "Order history list."),
    ("/account/orders/[id]", "order-actions.tsx — cancel, return, schedule."),
    ("/account/addresses", "Saved address management."),
    ("/account/recently-viewed", "Products from localStorage recent IDs."),
    ("/admin", "admin-charts.tsx dashboard."),
    ("/admin/products", "admin-products-manager.tsx CRUD."),
    ("/admin/orders", "Order admin list and [id] detail."),
    ("/admin/users", "admin-users-manager.tsx."),
    ("/admin/reviews", "Review moderation."),
    ("/admin/inventory", "Low-stock from admin stats."),
    ("/admin/audit", "Audit log viewer."),
    ("/admin/reports", "Reports page."),
    ("/admin/system", "System health display."),
    ("/admin/ai", "AI overview metrics."),
    ("/admin/ai/analytics", "Usage charts."),
    ("/admin/ai/logs", "Interaction log table."),
    ("/admin/ai/knowledge", "Knowledge CRUD UI."),
    ("/admin/ai/chunks", "Chunk inspection."),
    ("/admin/ai/config", "Read-only AI config."),
    ("/admin/ai/recommendations", "Recommendation analytics."),
    ("/admin/ai/visual-search", "Visual search analytics."),
    ("/admin/ai/faq", "FAQ admin page."),
]

FRONTEND_COMPONENTS: list[tuple[str, str]] = [
    ("app-shell.tsx", "Layout wrapper, navigation, footer integration."),
    ("product-card.tsx", "Catalog tile; trackRecommendationClick on click."),
    ("recommended-products.tsx", "Modes: trending, similar, bought-together, personalized, cart, etc."),
    ("checkout-flow.tsx", "Multi-step checkout state machine."),
    ("stripe-payment-form.tsx", "Stripe Elements PaymentIntent confirm."),
    ("assistant-cards.tsx", "Render product, comparison, order, policy cards from assistant API."),
    ("product-ai-insights.tsx", "Displays GET /Products/{id}/review-summary."),
    ("visual-search-cards.tsx", "Exact / similar / alternative match display."),
    ("admin-shell.tsx", "Admin layout and role gate."),
    ("admin-charts.tsx", "Revenue and order charts from /Admin/analytics."),
    ("smart-search.tsx", "Catalog search input."),
    ("category-mega-menu.tsx", "Category navigation."),
    ("compare-bar.tsx", "Floating compare tray."),
    ("product-view-tracker.tsx", "Writes recently viewed to localStorage."),
    ("saved-address-picker.tsx", "Checkout address selection."),
    ("order-status-badge.tsx", "OrderStatus visual mapping."),
    ("theme-provider.tsx", "Dark mode and EN/AR language via lib/i18n.ts."),
]

MIGRATIONS: list[tuple[str, str]] = [
    ("20251029212923_ProductModuleEntityCreate", "Products, brands, types"),
    ("20251126194634_OrderModuleEntitiesCreateAndSeed", "Orders, items, delivery"),
    ("20251203183818_OrderWithPaymentIntentAdd", "PaymentIntentId on orders"),
    ("20260520195234_AddProductReviews", "Reviews table"),
    ("20260521120000_AddNotifications", "Notifications"),
    ("20260603171748_AddAiAssistant", "Chat, knowledge, interaction logs"),
    ("20260603215026_AddOrderActions", "Cancel, return, schedule fields"),
    ("20260603215618_AddOrderPaymentMethod", "OrderPaymentMethod enum column"),
    ("20260603225831_AddAdminExtensions", "AuditLog, RecommendationEvent"),
    ("20260605115015_AddVisualSearchEvents", "VisualSearchEvent table"),
    ("20260606140602_AddOrderStockDeducted", "StockDeducted on Order"),
]

SERVICE_INTERFACES: list[tuple[str, list[str]]] = [
    ("IProductService", [
        "GetAllProductsAsync(ProductQueryParams) — paginated public catalog",
        "GetProductByIdAsync, GetAllBrandsAsync, GetAllTypesAsync",
        "GetRecommendedProductsAsync(productId) — same-category content similarity",
        "GetReviewsByProductIdAsync, AddReviewAsync",
        "CreateProductAsync, UpdateProductAsync, DeleteProductAsync — admin",
        "GetProductsForAdminPagedAsync, GetAllProductsForAdminAsync",
    ]),
    ("IOrderService", [
        "CreateOrderAsync(OrderDTO, email) — basket → order, stock deduct",
        "GetOrdersForUserAsync, GetOrderByIdAsync",
        "CancelOrderAsync, RequestReturnAsync, ScheduleDeliveryAsync",
    ]),
    ("IRecommendationService", [
        "GetTrendingAsync — LoadOrderLinesAsync volume, else review sort",
        "GetSimilarAsync — co-purchase then GetRecommendedProductsAsync",
        "GetBoughtTogetherAsync — co-purchase only",
        "GetPersonalizedAsync — buy-again, co-purchase, similar, wishlist",
        "GetForProductIdsAsync, GetByBudgetAsync, GetByCategoryAsync, GetByPriceProximityAsync",
    ]),
    ("IChatAssistantService", ["GetStatusAsync", "ChatAsync", "GetSessionHistoryAsync"]),
    ("IRagService", ["RetrieveAsync", "ReindexDocumentAsync", "ReindexAllAsync", "EnsureTextChunksAsync"]),
    ("IVisualSearchService", ["SearchAsync — Gemini vision + VisualProductMatcher"]),
    ("IPaymentService", ["GetStripeConfig", "CreatePaymentIntentAsync", "HandleWebhookAsync"]),
    ("IAuthenticationService", ["LoginAsync", "RegisterAsync", "GetAddressesAsync", "UpdateAddressAsync, ..."]),
    ("IAdminAiService", ["GetOverviewAsync", "GetAnalyticsAsync", "GetLogsAsync", "GetCostEstimateAsync, ..."]),
]


def build_data_model_chapter(doc) -> None:
    add_heading(doc, "Chapter 5: Data Model Overview", 1)
    add_paragraph(
        doc,
        "Corner Store persists catalog and AI data in ECommerceDBOnline (StoreDbContext) and "
        "identity data in ECommerceDBOnline.Security (StoreIdentityDbContext). Redis holds baskets "
        "and wishlists. Per-table field listings appear in Section 5.1 below; ER diagrams in Chapter 4.",
    )
    add_heading(doc, "5.1 Entity Roles", 2)
    roles = [
        ("Product", "Central catalog row; StockQuantity decremented by OrderService; PictureUrl served as static file."),
        ("Order / OrderItem", "Durable purchase record; ProductItemOrdered preserves ProductId at sale time for recommendations."),
        ("CustomerBasket", "Pre-checkout state in Redis; not migrated to SQL until order creation."),
        ("KnowledgeDocument", "Admin-editable policy text; chunked for RAG retrieval in assistant."),
        ("AssistantInteractionLog", "One row per assistant request; feeds Admin AI analytics and cost estimate."),
        ("RecommendationEvent", "Logged on recommendation API GET (impression) and track-click POST."),
        ("ApplicationUser", "Separate identity database; linked to orders by email string only."),
    ]
    for name, role in roles:
        add_paragraph(doc, f"{name}: {role}")
    add_page_break(doc)


def build_api_chapter(doc) -> None:
    from thesis_content_tools import build_controller_api_sections

    build_controller_api_sections(doc)


def build_frontend_chapter(doc) -> None:
    add_heading(doc, "Chapter 7: Frontend Application", 1)
    add_heading(doc, "7.1 App Router Pages", 2)
    for route, desc in FRONTEND_PAGES:
        add_paragraph(doc, f"{route}: {desc}")
    add_heading(doc, "7.2 Key Components", 2)
    add_table(doc, ["Component", "Role"], FRONTEND_COMPONENTS)
    add_heading(doc, "7.3 Client Services (lib/services/)", 2)
    add_bullets(
        doc,
        [
            "api-client.ts — base URL, JWT header, error handling",
            "products.ts, cart.ts (via context), orders.ts, payments.ts",
            "auth.ts, account.ts, notifications.ts, wishlist.ts",
            "recommendations.ts — all /Recommendations endpoints",
            "assistant.ts, visual-search.ts",
            "admin.ts, admin-ai.ts, knowledge.ts, reviews.ts",
        ],
    )
    add_page_break(doc)


def build_services_chapter(doc) -> None:
    add_heading(doc, "Chapter 8: Backend Services and Interfaces", 1)
    for iface, methods in SERVICE_INTERFACES:
        add_heading(doc, iface, 3)
        add_bullets(doc, methods)
    add_heading(doc, "8.1 Design Patterns in Code", 2)
    add_bullets(
        doc,
        [
            "Repository + UnitOfWork — GenericRepository<T>, IUnitOfWork.SaveChangesAsync",
            "Specification — OrderSpecification, product filter specs in ECommerce.Services.Specifications",
            "Result<T> — business failures as Error codes, not exceptions",
            "AutoMapper — OrderProfile, ReviewProfile, etc. in MappingProfiles/",
            "Keyed DI seeders — catalog vs identity in Program.cs",
        ],
    )
    add_heading(doc, "8.2 Persistence and Cache", 2)
    add_bullets(
        doc,
        [
            "StoreDbContext — catalog DB migrations in ECommerce.Persistence/Data/Migrations/",
            "StoreIdentityDbContext — identity migrations in IdentityData/Migrations/",
            "BasketRepository — Redis, 7-day TTL",
            "WishlistService — Redis key wishlist:{email}, 30-day TTL",
            "RedisCacheAttribute — default 5 minutes on GET /Products",
        ],
    )
    add_heading(doc, "8.3 Schema Migrations (store database)", 2)
    add_table(doc, ["Migration", "Purpose"], MIGRATIONS)
    add_page_break(doc)


def build_ai_chapter(doc) -> None:
    add_heading(doc, "Chapter 9: AI Subsystem Implementation", 1)

    add_heading(doc, "9.1 AiOptions (appsettings / environment)", 2)
    add_paragraph(
        doc,
        "Section AI in configuration. GEMINI_API_KEY environment variable overrides GeminiApiKey at startup "
        "(Program.cs PostConfigure). EnableStartupIndexing defaults false to avoid embedding API calls on "
        "every container boot.",
    )

    add_heading(doc, "9.2 Seeded Knowledge (AiKnowledgeSeeder.cs)", 2)
    add_numbered(
        doc,
        [
            "Shipping Policy (category Shipping)",
            "Return Policy (Returns)",
            "Payment Methods (Payment)",
            "Warranty (Warranty)",
            "Support Hours (FAQ)",
            "Shopping Guide (Product Guides)",
            "Privacy (FAQ)",
        ],
    )

    add_heading(doc, "9.3 Assistant Tools", 2)
    add_paragraph(
        doc,
        "AssistantToolExecutor maps Gemini function names to C# methods: searchProducts (keyword/category/"
        "brand/minPrice/maxPrice), recommendProducts, compareProducts, getSimilarProducts, getOrderStatus, "
        "getTrendingProducts, getPersonalizedRecommendations, getStorePolicies, getProductCategories, "
        "getReviewSummary.",
    )

    add_heading(doc, "9.4 Visual Search Constraints (VisualSearchService.cs)", 2)
    add_bullets(
        doc,
        [
            "MaxImageBytes = 10 * 1024 * 1024",
            "Allowed MIME: image/jpeg, image/jpg, image/png, image/webp",
            "Vision prompt: product attributes only; never identify people",
            "VisualProductMatcher tiers: exact ≥85, similar ≥55, alternative ≥25",
        ],
    )

    add_heading(doc, "9.5 Recommendation Algorithms (RecommendationService.cs)", 2)
    add_paragraph(
        doc,
        "LoadOrderLinesAsync uses OrderSpecification, excludes Cancelled and PaymentFailed orders, reads "
        "OrderItem.Product.ProductId and Quantity. GetTrendingAsync sums quantity by ProductId. "
        "GetCoPurchasedProductsAsync finds orders containing anchor IDs, ranks other products by co-occurring "
        "quantity. GetPersonalizedAsync merges: top repurchased IDs, co-purchase expansion, similar products "
        "for cart/recent/wishlist anchors, purchase trending, then review-based GetReviewTrendingAsync fallback.",
    )

    add_heading(doc, "9.6 Review Summary (ReviewSummaryService.cs)", 2)
    add_paragraph(
        doc,
        "Positive words: good, great, excellent, amazing, perfect, fast, useful. Negative: bad, poor, slow, "
        "broken, terrible, weak, expensive. ThemeLabels map tokens like battery, display, camera to readable "
        "labels. No Gemini call.",
    )

    add_heading(doc, "9.7 Admin AI (AdminAiService.cs)", 2)
    add_paragraph(
        doc,
        "Aggregates ChatSessions, ChatMessages, AssistantInteractionLogs, KnowledgeDocuments, "
        "VisualSearchEvents, RecommendationEvents. Cost endpoint multiplies logged token counts by configured "
        "rates for gemini-2.5-flash.",
    )
    add_page_break(doc)


def build_business_chapter(doc) -> None:
    add_heading(doc, "Chapter 10: Business Feasibility (Hypothetical Launch)", 1)
    add_paragraph(
        doc,
        "The Corner Store repository is a graduation software artifact. This chapter describes how the "
        "implemented features could support a commercial electronics shop—it does not report actual revenue.",
    )
    add_heading(doc, "10.1 Implemented Commercial Features", 2)
    add_bullets(
        doc,
        [
            "Multi-payment: Stripe, InstaPay, COD (OrderPaymentMethod enum)",
            "Inventory tracking: StockQuantity, StockDeducted, InventoryStockService reconciliation",
            "Admin analytics: /Admin/stats, /Admin/analytics",
            "AI cost visibility: /Admin/ai/cost",
            "Recommendation CTR: RecommendationEvent tracking",
        ],
    )
    add_heading(doc, "10.2 Cost Categories for a Real Launch", 2)
    add_table(
        doc,
        ["Category", "Relation to this project"],
        [
            ["Hosting", "Docker Compose demo; production would use cloud VM or PaaS"],
            ["Gemini API", "Usage logged in AssistantInteractionLog; cost endpoint in admin"],
            ["Stripe fees", "PaymentService webhook integration present"],
            ["Inventory COGS", "Not in repo — external business cost"],
        ],
    )
    add_heading(doc, "10.3 Illustrative Break-Even Formula", 2)
    add_paragraph(
        doc,
        "break_even_revenue = fixed_monthly_OPEX / gross_margin_fraction. Example: OPEX EGP 90,000 and "
        "18% margin → EGP 500,000/month revenue required. Order count = revenue / AOV. Substitute your "
        "own numbers; the application does not calculate this.",
    )
    add_page_break(doc)


def build_testing_chapter(doc) -> None:
    add_heading(doc, "Chapter 11: Testing and Quality Assurance", 1)
    add_table(
        doc,
        ["Test class", "Verifies"],
        [
            ["ReviewSummaryServiceTests", "Lexicon sentiment on sample reviews"],
            ["VisualProductMatcherTests", "Exact tier ≥85% when name and brand match"],
            ["RagChunkingTests", "Chunk overlap per AiOptions ChunkSize/ChunkOverlap"],
        ],
    )
    add_paragraph(doc, "Command: dotnet test CornerStore/backend/ECommerce.Services.Tests")
    add_heading(doc, "11.1 Manual Test Scenarios", 2)
    add_numbered(
        doc,
        [
            "docker compose up --build — all four services healthy",
            "Swagger at :5141/swagger lists all controllers",
            "Register user, login, JWT on protected /Orders",
            "Add to cart, checkout COD, verify StockQuantity decreased",
            "Place two orders sharing products — verify bought-together recommendations",
            "POST /Assistant/chat with GEMINI_API_KEY — verify tool call in admin logs",
            "Upload image on /visual-search — verify VisualSearchEvent in admin",
            "Admin knowledge edit + reindex-all",
        ],
    )
    add_page_break(doc)


def build_solution_structure(doc) -> None:
    add_heading(doc, "Chapter 2 (continued): Repository and Solution Layout", 1)
    add_table(
        doc,
        ["Path", "Purpose"],
        [
            ["CornerStore/frontend/", "Next.js 16 storefront (port 3848)"],
            ["CornerStore/backend/CornerStore.Api/", "ASP.NET Core host (port 5141)"],
            ["CornerStore/backend/ECommerce.Domain/", "Entities and contracts"],
            ["CornerStore/backend/ECommerce.Persistence/", "EF Core, migrations, Redis repos"],
            ["CornerStore/backend/ECommerce.Services/", "Business logic and AI"],
            ["CornerStore/backend/ECommerce.Services.Abstraction/", "Service interfaces"],
            ["CornerStore/backend/ECommerce.Presentation/", "REST controllers"],
            ["CornerStore/backend/ECommerce.Shared/", "DTOs and shared types"],
            ["CornerStore/backend/ECommerce.Services.Tests/", "xUnit tests"],
            ["CornerStore/database/", "Seed JSON mirrors and SQL notes"],
            ["CornerStore/docker-compose.yml", "Four-service orchestration"],
            ["scripts/generate_thesis_docx.py", "This thesis generator"],
        ],
    )
    add_heading(doc, "Environment Variables (docker-compose.yml)", 2)
    add_table(
        doc,
        ["Variable", "Service", "Purpose"],
        [
            ["ConnectionStrings__DefaultConnection", "backend", "Catalog SQL Server"],
            ["ConnectionStrings__IdentityConnection", "backend", "Identity SQL Server"],
            ["ConnectionStrings__RedisConnection", "backend", "redis:6379"],
            ["JWTOptions__SecretKey", "backend", "JWT signing"],
            ["GEMINI_API_KEY", "backend", "Google Gemini API"],
            ["STRIPE_SECRET_KEY / Stripe__SKey", "backend", "Stripe server key"],
            ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "frontend build", "Stripe.js"],
            ["NEXT_PUBLIC_API_URL", "frontend", "Browser API base"],
            ["API_INTERNAL_URL", "frontend", "SSR Docker internal API"],
            ["AI__EnableStartupIndexing", "backend", "Default false"],
            ["BootstrapAdmin__Email/Password/Role", "backend", "First admin seed"],
            ["FRONTEND_PORT / API_PORT", "compose", "Host port overrides"],
        ],
    )
    add_page_break(doc)


def build_extended_content(doc) -> None:
    build_solution_structure(doc)
    build_data_model_chapter(doc)
    build_api_chapter(doc)
    build_frontend_chapter(doc)
    build_services_chapter(doc)
    build_ai_chapter(doc)
    build_business_chapter(doc)
    build_testing_chapter(doc)
    build_dto_and_pipeline_chapter(doc)
    build_order_and_payment_detail(doc)


def build_dto_and_pipeline_chapter(doc) -> None:
    add_heading(doc, "Chapter 8 (continued): DTO Layer and HTTP Pipeline", 1)
    add_paragraph(
        doc,
        "API contracts live in ECommerce.Shared/DTOs. Controllers accept and return DTOs; AutoMapper "
        "profiles map entities to DTOs in ECommerce.Services/MappingProfiles/.",
    )
    dtos = [
        ("ProductDTO, CreateProductDTO, UpdateProductDTO", "Catalog"),
        ("BrandDTO, TypeDTO", "Catalog metadata"),
        ("BasketDTO, BasketItemDTO, StripeConfigDTO", "Cart and Stripe config"),
        ("OrderDTO, OrderToReturnDTO, OrderItemDTO, DeliveryMethodDTO", "Orders"),
        ("AddressDTO, ReturnOrderDTO, ScheduleOrderDTO", "Order actions"),
        ("UserDTO, LoginDTO, RegisterDTO, SavedAddressDTO, UpsertSavedAddressDTO", "Identity"),
        ("AccountDashboardDTO", "Account dashboard"),
        ("WishlistDTO", "Wishlist"),
        ("NotificationDTO", "Notifications"),
        ("ReviewDTO, CreateReviewDTO, ReviewSummaryDTO", "Reviews and AI summary"),
        ("AssistantChatRequestDTO, AssistantChatResponseDTO, AssistantContextDTO", "Assistant"),
        ("VisualSearchRequestDTO, VisualSearchResponseDTO, VisualProductMatchDTO", "Visual search"),
        ("AdminAnalyticsDTO, AdminAiDTOs, AdminUserDTO", "Admin and AI admin"),
        ("ProductImageUploadResultDTO", "Admin image upload"),
    ]
    add_table(doc, ["DTO types", "Domain"], dtos)

    add_heading(doc, "HTTP Pipeline (Program.cs)", 2)
    add_numbered(
        doc,
        [
            "ExceptionHandlerMiddleware",
            "Swagger / SwaggerUI (Development and Docker environments)",
            "UseStaticFiles — product images under /images/products/",
            "UseHttpsRedirection (non-Docker only)",
            "UseCors DevelopmentPolicy",
            "UseAuthentication, UseAuthorization",
            "MapControllers",
        ],
    )

    add_heading(doc, "Specification Classes", 2)
    add_bullets(
        doc,
        [
            "OrderSpecification — filter by email, include Items and DeliveryMethod",
            "OrderWithPaymentIntentSpecifications — order with PaymentIntentId for Stripe flows",
            "ProductWithTypeAndBrandSpecification — eager load brand and type",
            "ProductWithCountSpecifications — paginated catalog queries",
            "RecommendedProductsSpecification — same-type recommendations",
            "ReviewsByProductSpecification — reviews for product id",
            "BaseSpecifications — shared Include/OrderBy helpers",
        ],
    )
    add_page_break(doc)


def build_order_and_payment_detail(doc) -> None:
    add_heading(doc, "Chapter 8 (continued): Order and Payment Logic", 1)
    add_heading(doc, "OrderService.CreateOrderAsync Steps", 2)
    add_numbered(
        doc,
        [
            "Map ShipToAddress to OrderAddress owned object",
            "Load CustomerBasket from Redis by BasketId; fail if missing",
            "For each BasketItem: load Product by Id, validate exists, collect stockLines (product, qty)",
            "Load DeliveryMethod by basket DeliveryMethodId",
            "Validate stock: each line Quantity <= Product.StockQuantity",
            "Build Order with items via CreateOrderItem (ProductItemOrdered snapshot)",
            "Set SubTotal, apply delivery price, set Status Pending (or per payment method)",
            "Save order; deduct StockQuantity on each product; set StockDeducted true",
            "Create notification via NotificationService",
            "Delete Redis basket",
        ],
    )
    add_heading(doc, "OrderActionRules (cancel / return / schedule)", 2)
    add_bullets(
        doc,
        [
            "CanCancel: Pending or PaymentReceived",
            "CanReturn: PaymentReceived and OrderDate within 14 days",
            "CanSchedule: Pending or PaymentReceived",
            "ValidateScheduledDelivery: at least 2 hours ahead, max 14 days ahead",
        ],
    )
    add_heading(doc, "PaymentService Stripe Webhook", 2)
    add_paragraph(
        doc,
        "POST /Payments/webhook validates Stripe signature. EventTypes.PaymentIntentSucceeded sets "
        "order Status to PaymentReceived. EventTypes.PaymentIntentPaymentFailed sets PaymentFailed.",
    )
    add_heading(doc, "InventoryStockService (startup)", 2)
    add_paragraph(
        doc,
        "ReconcileInventoryStockAsync runs after seed: for non-cancelled orders where StockDeducted "
        "is false, deducts aggregated quantities once and sets StockDeducted true — corrects historical "
        "data after the AddOrderStockDeducted migration.",
    )
    add_page_break(doc)

