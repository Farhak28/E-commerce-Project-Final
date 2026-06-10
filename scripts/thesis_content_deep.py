"""Additional verified thesis sections — no invented features, no duplicate tables."""

from thesis_build import add_bullets, add_heading, add_numbered, add_page_break, add_paragraph, add_table

# Per-route detail: APIs and components not repeated in thesis_content_extended.FRONTEND_PAGES one-liners.
ROUTE_DETAIL: list[tuple[str, str, list[str], list[str]]] = [
    (
        "/ (Home)",
        "app/page.tsx",
        ["home-showcase.tsx", "recommended-products.tsx (trending, personalized, recent)"],
        ["GET /Products (featured)", "GET /Recommendations/trending", "GET /Recommendations/personalized/guest"],
    ),
    (
        "/products",
        "app/products/page.tsx",
        ["products-catalog.tsx", "smart-search.tsx", "product-card.tsx"],
        ["GET /Products?search&brandId&typeId&sort&PageIndex&PageSize", "GET /Products/brands", "GET /Products/types"],
    ),
    (
        "/products/[id]",
        "app/products/[id]/page.tsx (Server Component)",
        ["ProductGallery", "ProductPurchaseActions", "ProductAiInsights", "ProductDetailsTabs", "product-view-tracker.tsx"],
        [
            "GET /Products/{id}",
            "GET /Products/{id}/review-summary",
            "GET /Recommendations/bought-together/{id}",
            "GET /Recommendations/similar-price/{id}",
            "GET /Recommendations/for-products?productIds=",
            "POST /Recommendations/track-click",
        ],
    ),
    (
        "/categories and /categories/[category]",
        "app/categories/page.tsx, [category]/page.tsx",
        ["category-mega-menu.tsx", "products-catalog.tsx"],
        ["GET /Products/types", "GET /Products?typeId filtered by slug"],
    ),
    (
        "/cart",
        "app/cart/page.tsx",
        ["cart line list", "recommended-products mode=cart"],
        ["GET /Baskets?basketId=", "POST /Baskets", "GET /Recommendations/personalized/guest"],
    ),
    (
        "/checkout",
        "app/checkout/page.tsx",
        ["checkout-flow.tsx", "saved-address-picker.tsx", "stripe-payment-form.tsx"],
        [
            "GET /Orders/deliveryMethods",
            "GET /Authentication/Addresses (JWT)",
            "POST /Payments/{BasketId}",
            "GET /Payments/stripe-config",
            "POST /Orders",
        ],
    ),
    (
        "/login and /register",
        "app/login/page.tsx, register/page.tsx",
        ["auth forms", "auth-context.tsx"],
        ["POST /Authentication/Login", "POST /Authentication/Register", "GET /Authentication/emailExists"],
    ),
    (
        "/wishlist",
        "app/wishlist/page.tsx",
        ["wishlist-context.tsx", "product-card.tsx"],
        ["GET /Wishlists", "POST /Wishlists/{productId}", "DELETE /Wishlists/{productId}"],
    ),
    (
        "/compare",
        "app/compare/page.tsx",
        ["product-comparison-table.tsx", "compare-context.tsx", "compare-bar.tsx"],
        ["GET /Products/{id} for each compare ID (max 4 from compare-context)"],
    ),
    (
        "/notifications",
        "app/notifications/page.tsx",
        ["notification list UI"],
        ["GET /Notifications", "PUT /Notifications/{id}/read", "PUT /Notifications/read-all"],
    ),
    (
        "/visual-search",
        "app/visual-search/page.tsx",
        ["visual-search-cards.tsx", "image upload via lib/utils/image-upload.ts"],
        ["POST /Assistant/visual-search (base64 image, MIME validation client-side)"],
    ),
    (
        "/help",
        "app/help/page.tsx",
        ["Full-page assistant UI from assistant-context.tsx"],
        ["GET /Assistant/status", "POST /Assistant/chat", "GET /Assistant/sessions/{id}/messages"],
    ),
    (
        "/account/*",
        "dashboard, orders, addresses, recently-viewed",
        ["order-status-badge.tsx", "order-actions.tsx", "recently-viewed from localStorage"],
        [
            "GET /Account/dashboard",
            "GET /Orders",
            "GET /Orders/{id}",
            "POST /Orders/{id}/cancel|return|schedule",
            "CRUD /Authentication/Addresses",
        ],
    ),
    (
        "/admin/*",
        "admin-shell.tsx gated routes",
        [
            "admin-charts.tsx",
            "admin-products-manager.tsx",
            "admin-users-manager.tsx",
            "admin AI pages",
        ],
        [
            "GET /Admin/stats",
            "GET /Admin/analytics",
            "CRUD /Admin/products|users",
            "GET /Admin/ai/*",
            "GET /Knowledge/*",
            "POST /Knowledge/reindex-all",
        ],
    ),
]

DIAGRAM_WALKTHROUGH: list[tuple[str, list[str]]] = [
    (
        "Figure 4.1 — Use Case Diagram",
        [
            "Three human actors map to authorization tiers in the API. Guests call anonymous controllers "
            "(Products, Baskets, public Recommendation routes, Assistant). Customers add JWT-protected "
            "routes: Orders, Wishlists, Notifications, Account, personalized Recommendations.",
            "Admins require Identity roles Admin or SuperAdmin checked on AdminController and "
            "KnowledgeController. Stripe and Gemini are external systems: PaymentService webhook and "
            "GeminiProvider HTTP client respectively.",
        ],
    ),
    (
        "Figure 4.2 — Store ER Diagram",
        [
            "ProductBrand and ProductType normalize catalog metadata. Product.Reviews cascade on delete. "
            "Order uses owned OrderAddress (not a separate table row). OrderItem stores ProductItemOrdered "
            "as owned value object — ProductId at purchase time is preserved even if catalog changes.",
            "AI tables (KnowledgeDocument, ChatSession) and analytics tables (VisualSearchEvent, "
            "RecommendationEvent, AuditLog) have no FK to Product except through JSON or int arrays in "
            "application logic.",
        ],
    ),
    (
        "Figure 4.3 — Identity ER Diagram",
        [
            "ApplicationUser extends IdentityUser with DisplayName and Addresses collection. Orders link "
            "by UserEmail string only — no cross-database FK. This allows store and identity databases "
            "to migrate independently per docker-compose SQL Server instance.",
        ],
    ),
    (
        "Figure 4.4 — Redis Keys",
        [
            "BasketRepository stores CustomerBasket JSON under client-generated GUID keys with 7-day TTL. "
            "WishlistService uses wishlist:{email} with 30-day TTL. RedisCacheAttribute on GET /Products "
            "adds response cache keys for five minutes.",
        ],
    ),
    (
        "Figure 4.5 — Domain Class Diagram",
        [
            "BaseEntity<TKey> provides Id. OrderStatus enum: Pending, PaymentReceived, PaymentFailed, "
            "Cancelled, ReturnRequested, Returned. OrderPaymentMethod: Card, ApplePay, InstaPay, "
            "CashOnDelivery. CustomerBasket is not an EF entity — serialized to Redis.",
        ],
    ),
    (
        "Figure 4.6 — Service Layer",
        [
            "All business services register as scoped in Program.cs except IVectorStore (singleton) and "
            "IConnectionMultiplexer (singleton). IUnitOfWork wraps StoreDbContext SaveChanges. "
            "BasketRepository is the only Redis-backed repository.",
        ],
    ),
    (
        "Figure 4.7 — AI Module",
        [
            "ChatAssistantService casts IAIProvider to GeminiProvider at construction — other providers "
            "would fail fast. InMemoryVectorStore loads embeddings from KnowledgeChunk.EmbeddingJson on "
            "startup when indexing runs. VisualProductMatcher is pure C# scoring, no ML model.",
        ],
    ),
    (
        "Figure 4.8 — Frontend Structure",
        [
            "Next.js App Router pages under app/ import components/ and lib/services/. Context providers "
            "wrap the tree in layout.tsx: Auth, Cart, Wishlist, Compare, Assistant, Theme. "
            "assistant-logic.ts provides keyword fallback when API returns not configured.",
        ],
    ),
    (
        "Figure 4.9 — Deployment",
        [
            "docker-compose.yml defines frontend (3848), backend (5141), sqlserver, redis. Frontend SSR "
            "uses API_INTERNAL_URL=http://backend:5141/api inside Docker network. Product images volume "
            "cornerstore-product-images maps to wwwroot/images/products/.",
        ],
    ),
    (
        "Figure 4.10 — Login Sequence",
        [
            "AuthenticationService.LoginAsync validates via UserManager.CheckPasswordAsync, builds JWT "
            "with 1-hour expiry from JWTOptions in appsettings. Frontend stores token; api-client.ts "
            "adds Authorization header on subsequent requests.",
        ],
    ),
    (
        "Figure 4.11 — Cart to Order",
        [
            "OrderService validates each basket line against live Product.StockQuantity before save. "
            "On success StockDeducted=true and quantities decrement. NotificationService creates user "
            "notification. Redis basket key deleted.",
        ],
    ),
    (
        "Figure 4.12 — Stripe Sequence",
        [
            "PaymentService creates Stripe PaymentIntent; basket stores PaymentIntentID and ClientSecret. "
            "Webhook validates signature; PaymentIntentSucceeded maps to OrderStatus.PaymentReceived.",
        ],
    ),
    (
        "Figure 4.13 — Assistant Chat",
        [
            "BuildSystemPrompt injects RAG chunks, cart/recent/compare IDs, and category list. Loop up to "
            "MaxToolIterations (3): Gemini returns tool calls → AssistantToolExecutor → function response "
            "appended → next Gemini turn. AssistantInteractionLog stores RetrievedChunks, ToolCalls, tokens.",
        ],
    ),
    (
        "Figure 4.14 — Visual Search",
        [
            "Gemini vision extracts VisualProductAttributesDTO. Full catalog loaded; VisualProductMatcher "
            "scores each product. Tiers: exact ≥85, similar ≥55, alternative ≥25. VisualSearchEvent "
            "persisted for admin analytics.",
        ],
    ),
    (
        "Figure 4.15 — Co-purchase Recommendations",
        [
            "LoadOrderLinesAsync excludes Cancelled and PaymentFailed. GetCoPurchasedProductsAsync finds "
            "orders containing anchor ProductId, ranks co-occurring products by summed Quantity. "
            "RecommendationTrackingService logs impression on GET and click on track-click POST.",
        ],
    ),
    (
        "Figure 4.16 — Checkout Activity",
        [
            "checkout-flow.tsx steps: review cart → address → delivery method → payment method. "
            "Card/ApplePay path uses stripe-payment-form before POST /Orders. COD and InstaPay skip "
            "Stripe confirm but still create order via OrderService.",
        ],
    ),
    (
        "Figure 4.17 — Order Status Lifecycle",
        [
            "OrderActionRules: CanCancel for Pending or PaymentReceived. CanReturn within 14 days of "
            "OrderDate when PaymentReceived. CanSchedule for Pending or PaymentReceived; delivery time "
            "must be 2 hours to 14 days ahead.",
        ],
    ),
    (
        "Figure 4.18 — Assistant Tool Loop",
        [
            "If Gemini returns no tool calls, final text is returned. If MaxToolIterations exceeded "
            "without final text, user sees tool limit message. Rate limit and invalid key errors return "
            "user-facing hints from ChatAssistantService catch block.",
        ],
    ),
    (
        "Figure 4.19 — Knowledge Reindex",
        [
            "RagService.ReindexDocumentAsync deletes chunks and vector entries, rechunks with ChunkSize 800 "
            "and ChunkOverlap 100, calls EmbedAsync per chunk when AI configured. EnableStartupIndexing "
            "false by default avoids embedding quota on every container start.",
        ],
    ),
    (
        "Figure 4.20 — Admin Product Upload",
        [
            "POST /Admin/products/upload-image accepts multipart file; ProductImageStorage writes "
            "wwwroot/images/products/{guid}.ext. Admin product save sets PictureUrl. AuditLogService "
            "records actor and action.",
        ],
    ),
    (
        "Figure 4.21 — Package Diagram",
        [
            "Dependency rule: Domain has no references to outer layers. Services depend on Domain "
            "contracts and abstractions. API project composes all layers at startup. Shared DTOs are "
            "referenced by Presentation and Services without pulling EF entities to the client.",
        ],
    ),
    (
        "Figure 4.22 — Basket and Order State",
        [
            "Basket state is ephemeral in Redis; successful POST /Orders deletes the key. Orders "
            "transition through OrderStatus enum; cancel restores stock when StockDeducted was true. "
            "Return flow sets ReturnRequested then Returned via OrderService.RequestReturnAsync.",
        ],
    ),
]


def build_expanded_early_chapters(doc) -> None:
    add_heading(doc, "Chapter 1 (continued): Motivation and Contributions", 1)
    add_paragraph(
        doc,
        "Traditional graduation e-commerce demos often implement catalog and checkout only. Corner Store "
        "extends that baseline with three research-relevant integrations: retrieval-augmented generation "
        "for store policies, function-calling tools that query live inventory and orders, and multimodal "
        "visual search scored against the real product catalog.",
    )
    add_paragraph(
        doc,
        "The implementation is reproducible: docker-compose.yml starts SQL Server, Redis, API, and "
        "frontend with documented environment variables. Seed data loads 59 products across six categories "
        "(Smartphones, Gaming, Laptops, Audio, Accessories, Smart Watches), 29 brands, and four delivery "
        "methods from JSON files in CornerStore/database/seed-data/.",
    )
    add_heading(doc, "1.4 Methodology", 2)
    add_numbered(
        doc,
        [
            "Requirements traced to controller routes and frontend pages in the repository.",
            "UML diagrams derived from ECommerce.Domain entities and service classes.",
            "AI behavior documented from AiOptions, ChatAssistantService system prompt, and AssistantToolCatalog.",
            "Testing: three xUnit test classes plus manual scenarios in Chapter 11.",
        ],
    )

    add_heading(doc, "Chapter 2 (continued): Technology Stack", 1)
    add_table(
        doc,
        ["Layer", "Technology", "Version / notes"],
        [
            ["Frontend", "Next.js App Router, React, TypeScript", "Port 3848 in Docker"],
            ["Backend", "ASP.NET Core Web API", ".NET 8, Clean Architecture projects"],
            ["Catalog DB", "SQL Server + EF Core", "ECommerceDBOnline, StoreDbContext"],
            ["Identity DB", "SQL Server + Identity Core", "ECommerceDBOnline.Security"],
            ["Cache", "Redis 7", "Baskets, wishlists, response cache"],
            ["Payments", "Stripe.net", "PaymentIntent + webhook"],
            ["AI", "Google Gemini REST", "gemini-2.5-flash, text-embedding-004"],
            ["Mapping", "AutoMapper", "OrderProfile, ReviewProfile, etc."],
            ["API docs", "Swashbuckle", "JWT Bearer scheme in Swagger UI"],
        ],
    )

    add_heading(doc, "Chapter 2 (continued): Clean Architecture Layers", 1)
    add_bullets(
        doc,
        [
            "ECommerce.Domain — entities, enums, IGenericRepository contracts; no external dependencies.",
            "ECommerce.Persistence — DbContexts, migrations, BasketRepository, CacheRepository, seeders.",
            "ECommerce.Services.Abstraction — service interfaces including AI abstractions.",
            "ECommerce.Services — ProductService, OrderService, AI module, specifications, AutoMapper profiles.",
            "ECommerce.Presentation — controllers only; no business logic.",
            "ECommerce.Shared — DTOs and Result<T> error types consumed by API and services.",
            "CornerStore.Api (ECommerce.API) — Program.cs DI, middleware, startup migration and seed.",
        ],
    )

    add_heading(doc, "Chapter 3 (continued): Non-Functional Requirements Detail", 1)
    add_bullets(
        doc,
        [
            "Performance: GET /Products cached 5 minutes via RedisCacheAttribute.",
            "Availability: ChatAssistantService returns configuration message when GEMINI_API_KEY missing.",
            "Security: JWT validation (issuer, audience, lifetime); Admin role on admin routes.",
            "Observability: AssistantInteractionLog, VisualSearchEvent, RecommendationEvent, AuditLog.",
            "Maintainability: Specification pattern isolates EF queries; Result<T> for expected failures.",
        ],
    )
    add_page_break(doc)


def build_frontend_routes_deep(doc) -> None:
    add_heading(doc, "Chapter 7 (continued): Route-by-Route Implementation", 1)
    add_paragraph(
        doc,
        "Each subsection lists the page file, primary components, and backend endpoints invoked. "
        "All routes exist under CornerStore/frontend/app/.",
    )
    for title, page_file, components, apis in ROUTE_DETAIL:
        add_heading(doc, title, 3)
        add_paragraph(doc, f"Page: {page_file}.")
        add_paragraph(doc, "Components: " + ", ".join(components) + ".")
        add_paragraph(doc, "API calls: " + "; ".join(apis) + ".")
    add_page_break(doc)


def build_diagram_deep_narratives(doc) -> None:
    add_heading(doc, "Chapter 4 (continued): Diagram Walkthrough", 1)
    add_paragraph(
        doc,
        "The following sections explain each design figure in implementation terms. Cross-reference "
        "Chapter 4 figures when reading.",
    )
    for title, paragraphs in DIAGRAM_WALKTHROUGH:
        add_heading(doc, title, 3)
        for p in paragraphs:
            add_paragraph(doc, p)
    add_page_break(doc)


def build_ai_implementation_deep(doc) -> None:
    add_heading(doc, "Chapter 9 (continued): GeminiProvider and RAG Pipeline", 1)

    add_heading(doc, "9.8 GeminiProvider HTTP Methods", 2)
    add_bullets(
        doc,
        [
            "GenerateEmbeddingAsync — POST embedContent to text-embedding-004.",
            "GenerateResponseAsync — generateContent for plain text.",
            "GenerateWithContentsAsync — multi-turn with function declarations (assistant loop).",
            "AnalyzeImageAsync — vision model for visual search attribute extraction.",
            "IsConfigured — true when GeminiApiKey non-empty; API key validated AIza or AQ. prefix in ChatAssistantService.",
        ],
    )

    add_heading(doc, "9.9 System Prompt Rules (ChatAssistantService.BuildSystemPrompt)", 2)
    add_numbered(
        doc,
        [
            "Never invent products, prices, stock, or order status.",
            "Always use tools for product facts, recommendations, comparisons, orders, policies.",
            "Use retrieved knowledge for FAQ when relevant.",
            "Catalog prices are USD; EGP mentioned by user treated as numeric budget cap only.",
            "Use exact category names from GetAllTypesAsync with recommendProducts.",
            "Use getReviewSummary for review sentiment — never invent opinions.",
        ],
    )

    add_heading(doc, "9.10 RAG Retrieval Fallback", 2)
    add_paragraph(
        doc,
        "RagService.RetrieveAsync embeds the user query when AI is configured, searches InMemoryVectorStore "
        "for top-K (default 5) cosine similarity hits. On failure or empty results, KeywordRetrieveAsync "
        "tokenizes the query and scores KnowledgeChunk.Text by term overlap. EnsureTextChunksAsync creates "
        "chunks without embeddings when EnableStartupIndexing is false — keyword fallback still works.",
    )

    add_heading(doc, "9.11 VisualProductMatcher Scoring", 2)
    add_paragraph(
        doc,
        "ScoreProduct combines name match (up to 92), brand match (+25), category alias match via "
        "CategoryAliases dictionary (six store categories), and keyword overlap on description. Products "
        "scoring below 25 are excluded. If no matches, fallback returns top-rated catalog items as "
        "alternative tier with score 30.",
    )

    add_heading(doc, "9.12 Frontend Assistant Fallback (assistant-logic.ts)", 2)
    add_paragraph(
        doc,
        "When POST /Assistant/chat fails or assistant not configured, assistant-client may invoke "
        "local keyword logic for basic product/policy hints. Session state persists in localStorage via "
        "storage keys in lib/constants/storage.ts. AssistantContext sends cart product IDs, recently "
        "viewed IDs, and compare IDs in AssistantContextDTO on each message.",
    )
    add_page_break(doc)


def build_security_and_state(doc) -> None:
    add_heading(doc, "Chapter 8 (continued): Security and Client State", 1)

    add_heading(doc, "Authorization Model", 2)
    add_bullets(
        doc,
        [
            "Anonymous: Products, Baskets, public Recommendations, Assistant, Chat, stripe-config.",
            "JWT Bearer: Orders, Payments (except webhook), Wishlists, Notifications, Account, addresses.",
            "Admin role: AdminController, KnowledgeController — Identity roles Admin or SuperAdmin.",
            "BootstrapAdmin__Email/Password/Role seeds first admin when identity DB empty.",
        ],
    )

    add_heading(doc, "React Context Providers", 2)
    add_table(
        doc,
        ["Context", "Storage", "Purpose"],
        [
            ["auth-context.tsx", "JWT in localStorage via api-client", "Session, signIn, addresses CRUD"],
            ["cart-context.tsx", "Redis via basketId GUID in localStorage", "Basket lines, delivery, totals"],
            ["wishlist-context.tsx", "Redis wishlist:{email}", "Add/remove wishlist products"],
            ["compare-context.tsx", "localStorage max 4 IDs", "Product comparison tray"],
            ["assistant-context.tsx", "localStorage session + messages", "Chat UI, visual search upload"],
            ["theme-provider.tsx", "localStorage preferences", "Dark mode, EN/AR via lib/i18n.ts"],
        ],
    )

    add_heading(doc, "Account Dashboard Metrics (AccountService)", 2)
    add_bullets(
        doc,
        [
            "rewardPoints = totalOrders × 300 + (int)sum(SubTotal / 10)",
            "loyaltyTier: Bronze (<3 orders), Silver (3–9), Gold (10–19), Platinum (≥20)",
            "profileCompletion: base 40 + 35 if address + 15 if orders + 10 if wishlist (cap 100)",
            "topInterests: top 3 categories guessed from order item product names",
        ],
    )

    add_heading(doc, "Exception Handling", 2)
    add_paragraph(
        doc,
        "ExceptionHandlerMiddleware wraps unhandled exceptions as JSON ApiResponse. Controllers use "
        "ApiResponseFactory for validation errors (InvalidModelStateResponseFactory). Business failures "
        "return Result<T>.Error codes such as InsufficientStock, Schedule.TooSoon, Schedule.TooFar.",
    )
    add_page_break(doc)


def build_recommendation_and_catalog_deep(doc) -> None:
    add_heading(doc, "Chapter 8 (continued): Recommendation Engine Detail", 1)

    add_heading(doc, "Co-purchase Algorithm", 2)
    add_numbered(
        doc,
        [
            "LoadOrderLinesAsync: all OrderItems from non-cancelled, non-failed orders.",
            "Build map OrderId → set of ProductIds in that order.",
            "For anchor IDs, find orders containing any anchor.",
            "Aggregate other ProductIds in those orders weighted by OrderItem.Quantity.",
            "Exclude anchor IDs; resolve ProductDTO via GetProductByIdAsync in rank order.",
        ],
    )

    add_heading(doc, "Personalization Merge Order (GetPersonalizedAsync)", 2)
    add_paragraph(
        doc,
        "When userEmail provided: repurchase candidates from user's order history, co-purchase expansion "
        "from cart and recent product IDs, similar products per anchor, purchase trending, wishlist items. "
        "Guest path uses cart and recent IDs only. CategoryAliases dictionary maps slug variants to the "
        "six ProductType names for GetByCategoryAsync.",
    )

    add_heading(doc, "Seed Catalog Structure", 2)
    add_table(
        doc,
        ["Seed file", "Count", "Used by"],
        [
            ["products.json", "59", "DataIntializer catalog seed"],
            ["brands.json", "29", "ProductBrand rows"],
            ["types.json", "6 categories", "ProductType rows"],
            ["delivery.json", "4 methods", "DeliveryMethod seed"],
        ],
    )
    add_paragraph(
        doc,
        "Product images referenced by PictureUrl paths under /images/products/ — either seeded paths "
        "or admin-uploaded GUID filenames from ProductImageStorage.",
    )
    add_page_break(doc)


SERVICE_FILES: list[tuple[str, str]] = [
    ("ProductService.cs", "Catalog queries via specifications; admin CRUD; review add/list; same-type recommendations via RecommendedProductsSpecification."),
    ("OrderService.cs", "CreateOrderAsync from Redis basket; stock validation and deduction; cancel restores stock; return and schedule via OrderActionRules."),
    ("BasketService.cs", "Maps CustomerBasket to BasketDTO; delegates persistence to IBasketRepository."),
    ("PaymentService.cs", "Stripe PaymentIntent on basket total; MinAmountCents=50; webhook updates order status."),
    ("AuthenticationService.cs", "Identity login/register; JWT 1-hour; saved addresses CRUD on ApplicationUser."),
    ("RecommendationService.cs", "Co-purchase, trending, personalization, budget/category/price proximity modes."),
    ("RecommendationTrackingService.cs", "Persists RecommendationEvent for impressions and clicks."),
    ("NotificationService.cs", "Creates Notification rows on order events; list and mark-read for user email."),
    ("AccountService.cs", "Dashboard KPIs: loyalty tier, reward points, profile completion, top interests."),
    ("AdminService.cs", "Stats, analytics series, reports, user/product/order/review admin operations."),
    ("AdminAiService.cs", "Aggregates AI tables for admin /ai/* endpoints including cost estimate from token logs."),
    ("AuditLogService.cs", "Append-only AuditLog for admin actions."),
    ("WishlistService.cs", "Redis wishlist:{email}, 30-day TTL, product ID list."),
    ("CacheService.cs", "Wraps ICacheRepository for generic Redis get/set used by RedisCacheAttribute."),
    ("InventoryStockService.cs", "Startup reconciliation for orders missing StockDeducted flag."),
    ("ProductImageStorage.cs", "Saves uploaded images to wwwroot/images/products/ with GUID filename."),
    ("ReviewSummaryService.cs", "Lexicon-based positive/negative themes; no external AI call."),
    ("ChatAssistantService.cs", "RAG + Gemini tool loop; persists ChatSession and AssistantInteractionLog."),
    ("AssistantToolExecutor.cs", "Dispatches ten tool names to ProductService, OrderService, RagService, etc."),
    ("RagService.cs", "Vector search with keyword fallback; chunk size 800 overlap 100."),
    ("GeminiProvider.cs", "HTTP client for embedContent and generateContent with function calling."),
    ("VisualSearchService.cs", "Image validation 10MB; vision prompt; VisualProductMatcher tiers."),
    ("VisualProductMatcher.cs", "Rule-based scoring 85/55/25 thresholds."),
    ("KnowledgeService.cs", "CRUD for KnowledgeDocument; triggers reindex on content change."),
    ("AiKnowledgeSeeder.cs", "Seeds seven policy documents on empty knowledge table."),
    ("InMemoryVectorStore (VectorStore.cs)", "Loads EmbeddingJson from DB; cosine similarity search."),
]


def build_service_file_reference(doc) -> None:
    add_heading(doc, "Chapter 8 (continued): Service Class Reference", 1)
    add_paragraph(
        doc,
        "Each row maps a C# source file under ECommerce.Services/ to its responsibility in the running application.",
    )
    add_table(doc, ["Source file", "Responsibility"], SERVICE_FILES)
    add_page_break(doc)


def build_persistence_and_payment(doc) -> None:
    add_heading(doc, "Chapter 5 (continued): EF Configurations and Payment Methods", 1)

    add_heading(doc, "5.2 AI Entity Configurations (AiConfigurations.cs)", 2)
    add_bullets(
        doc,
        [
            "KnowledgeDocument: Title max 256, Category max 128, cascade delete to Chunks.",
            "KnowledgeChunk: required Text and EmbeddingJson; index on DocumentId.",
            "ChatSession/ChatMessage: cascade delete messages; Role max 32; index on SessionId.",
            "AssistantInteractionLog: long identity PK.",
            "VisualSearchEvent: DetectedCategory max 128; index on CreatedAt.",
        ],
    )

    add_heading(doc, "5.3 Payment Methods (OrderPaymentMethod)", 2)
    add_table(
        doc,
        ["Method", "Frontend flow", "Backend behavior"],
        [
            ["Card", "stripe-payment-form.tsx confirms PaymentIntent", "Order Pending until webhook PaymentReceived"],
            ["ApplePay", "Stripe wallet path in checkout-flow", "Same Stripe webhook lifecycle"],
            ["InstaPay", "Manual confirmation in checkout", "Order created without Stripe intent"],
            ["CashOnDelivery", "COD selection", "Order created; no PaymentIntent"],
        ],
    )

    add_heading(doc, "5.4 Related Work", 2)
    add_paragraph(
        doc,
        "Retrieval-augmented generation (Lewis et al., 2020) motivates grounding the assistant on "
        "KnowledgeChunk text rather than model parametric memory alone. Function calling aligns with "
        "tool-augmented LLM patterns: the model proposes structured calls; Corner Store executes them "
        "against ProductService and OrderService so prices and stock match the database. Visual search "
        "combines multimodal LLM attribute extraction with deterministic catalog matching—a hybrid "
        "approach that avoids training a custom vision model while staying tied to seeded products.",
    )
    add_page_break(doc)


def build_deep_content(doc) -> None:
    build_expanded_early_chapters(doc)
    build_diagram_deep_narratives(doc)
    build_frontend_routes_deep(doc)
    build_ai_implementation_deep(doc)
    build_security_and_state(doc)
    build_recommendation_and_catalog_deep(doc)
    build_service_file_reference(doc)
    build_persistence_and_payment(doc)
    build_deployment_and_filters(doc)
    build_api_error_catalog(doc)


def build_deployment_and_filters(doc) -> None:
    add_heading(doc, "Chapter 2 (continued): Docker Compose Services", 1)
    add_paragraph(
        doc,
        "CornerStore/docker-compose.yml orchestrates four services with health checks. The database "
        "service uses mcr.microsoft.com/mssql/server:2022-latest with SA password from compose file, "
        "volume cornerstore-sql-data, and TCP health check on port 1433. Redis 7-alpine exposes 6379 "
        "with redis-cli ping health check.",
    )
    add_paragraph(
        doc,
        "The backend container builds from backend/CornerStore.Api/Dockerfile, waits for database and "
        "redis healthy, mounts cornerstore-product-images volume for uploaded product photos, and sets "
        "ASPNETCORE_ENVIRONMENT=Docker. Connection strings target hostnames database and redis inside "
        "the compose network. DataSeed__ReloadFromJsonOnStartup defaults false so restarts do not wipe "
        "admin changes.",
    )
    add_paragraph(
        doc,
        "The frontend container builds with build args NEXT_PUBLIC_API_URL (browser), "
        "API_INTERNAL_URL=http://backend:5141/api (server-side fetch), and optional Stripe publishable "
        "key. Port FRONTEND_PORT defaults 3848; API_PORT defaults 5141.",
    )

    add_heading(doc, "Chapter 6 (continued): Product Catalog Query Parameters", 1)
    add_table(
        doc,
        ["Parameter", "Type", "Behavior"],
        [
            ["search", "string?", "Name/description filter in ProductWithCountSpecifications"],
            ["brandId", "int?", "Filter by ProductBrandId"],
            ["typeId", "int?", "Filter by ProductTypeId (category)"],
            ["sort", "ProductSortingOptions", "NameAsc, NameDesc, PriceAsc, PriceDesc"],
            ["PageIndex", "int", "Default 1; values ≤0 reset to 1"],
            ["PageSize", "int", "Default 5; max 50"],
        ],
    )
    add_paragraph(
        doc,
        "GET /Products responses are cached in Redis for five minutes when RedisCacheAttribute applies. "
        "Admin product list uses separate admin endpoints with larger page sizes via GetProductsForAdminPagedAsync.",
    )

    add_heading(doc, "Chapter 7 (continued): Frontend lib/ Module Map", 1)
    add_table(
        doc,
        ["Path", "Role"],
        [
            ["lib/services/api-client.ts", "Base URL, JWT header, ApiError type"],
            ["lib/services/*.ts", "One module per controller group (see Chapter 7 mapping table)"],
            ["lib/*-context.tsx", "React state: auth, cart, wishlist, compare, assistant"],
            ["lib/chatbot/", "assistant-client.ts, assistant-logic.ts offline fallback, policies.ts"],
            ["lib/utils/", "basket, product, images, order-status, recently-viewed, address"],
            ["lib/types/", "Shared TypeScript interfaces mirroring DTOs"],
            ["lib/i18n.ts", "EN/AR strings for theme-provider"],
            ["lib/payment-methods.ts", "Checkout payment method labels matching OrderPaymentMethod"],
            ["lib/stripe-config.ts, stripe-loader.ts", "Lazy Stripe.js load from /Payments/stripe-config"],
            ["lib/constants/storage.ts", "localStorage keys for basket, assistant session, compare"],
        ],
    )
    add_page_break(doc)


def build_api_error_catalog(doc) -> None:
    add_heading(doc, "Appendix H: API Business Error Codes", 1)
    add_paragraph(
        doc,
        "Corner Store returns structured errors via Result<T> and ApiResponseFactory. Common codes "
        "verified in service source:",
    )
    add_table(
        doc,
        ["Code", "Source", "Meaning"],
        [
            ["Product.InsufficientStock", "OrderService", "Basket quantity exceeds StockQuantity"],
            ["Order.NotFound", "OrderService, AdminService", "Guid order not found for user"],
            ["Schedule.TooSoon / TooFar", "OrderActionRules", "Delivery schedule outside 2h–14d window"],
            ["Return.ReasonRequired", "OrderService", "Return POST missing reason"],
            ["Stripe.NotConfigured", "PaymentService", "Missing Stripe:SKey"],
            ["Stripe.Error", "PaymentService", "Stripe API exception message"],
            ["Basket not found", "PaymentService", "Invalid basketId in Redis"],
            ["Knowledge.NotFound", "KnowledgeService", "Document id missing"],
            ["User.NotFound / EmailExists", "AdminService, AuthenticationService", "Identity operations"],
            ["Image.TooLarge", "ProductImageStorage", "Admin upload over 5 MB"],
        ],
    )

    add_heading(doc, "Chapter 11 (continued): Extended Manual Test Checklist", 2)
    add_numbered(
        doc,
        [
            "Filter /products by brand and type; verify sort PriceAsc changes order.",
            "Guest personalized recommendations with items in cart only (no JWT).",
            "Compare page with four products; verify product-comparison-table columns.",
            "Schedule delivery on order detail; verify Schedule.TooSoon if under 2 hours.",
            "Admin knowledge edit + POST /Knowledge/reindex-all; ask assistant policy question.",
            "Admin /admin/ai/cost after several chat turns; verify token counts in logs.",
            "Wishlist add/remove; verify Redis key after login.",
            "Notification appears after order; mark read updates unread-count.",
            "Visual search with PNG over 10 MB rejected by API.",
            "Bootstrap admin login when identity DB empty using BootstrapAdmin env vars.",
        ],
    )
    add_page_break(doc)
