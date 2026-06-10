using System.Security.Claims;
using System.Text;
using ECommerce.API.CustomMiddlewares;
using ECommerce.API.Extensions;
using ECommerce.API.Factories;
using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.IdentityModule;
using ECommerce.Persistence.Data.DataSeed;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Persistence.IdentityData.DataSeed;
using ECommerce.Persistence.IdentityData.DbContexts;
using ECommerce.Persistence.Repositories;
using ECommerce.Services;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Services.AI;
using ECommerce.Services.MappingProfiles;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace ECommerce.API
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            #region Register DI Container
            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Corner Store API", Version = "v1", Description = "CornerStore graduation project REST API" });

                c.AddSecurityDefinition(
                    "Bearer",
                    new OpenApiSecurityScheme
                    {
                        Description =
                            "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                        Name = "Authorization",
                        In = ParameterLocation.Header,
                        Type = SecuritySchemeType.ApiKey,
                        Scheme = "Bearer",
                    }
                );

                c.AddSecurityRequirement(
                    new OpenApiSecurityRequirement
                    {
                        {
                            new OpenApiSecurityScheme
                            {
                                Reference = new OpenApiReference
                                {
                                    Type = ReferenceType.SecurityScheme,
                                    Id = "Bearer",
                                },
                            },
                            new string[] { }
                        },
                    }
                );
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy(
                    "DevelopmentPolicy",
                    builder =>
                    {
                        builder.AllowAnyHeader().AllowAnyOrigin().AllowAnyMethod();
                    }
                );
            });

            builder.Services.AddDbContext<StoreDbContext>(options =>
            {
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection")
                );
            });

            builder.Services.AddKeyedScoped<IDataIntializer, DataIntializer>("Default");
            builder.Services.AddKeyedScoped<IDataIntializer, IdentityDataIntializer>("Identity");

            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

            builder.Services.AddAutoMapper(cfg => { }, typeof(ServiceAssemblyReference));

            builder.Services.AddScoped<IProductService, ProductService>();

            builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
            {
                return ConnectionMultiplexer.Connect(
                    builder.Configuration.GetConnectionString("RedisConnection")!
                );
            });

            builder.Services.AddScoped<IBasketRepository, BasketRepository>();
            builder.Services.AddScoped<IBasketService, BasketService>();
            builder.Services.AddScoped<ICacheRepository, CacheRepository>();
            builder.Services.AddScoped<ICacheService, CacheService>();

            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory =
                    ApiResponseFactory.GenerateApiValidationResponse;
            });

            builder.Services.AddDbContext<StoreIdentityDbContext>(Options =>
            {
                Options.UseSqlServer(
                    builder.Configuration.GetConnectionString("IdentityConnection")
                );
            });

            //builder
            //    .Services.AddIdentity<ApplicationUser, IdentityRole>()
            //    .AddEntityFrameworkStores<StoreIdentityDbContext>();

            builder
                .Services.AddIdentityCore<ApplicationUser>()
                .AddRoles<IdentityRole>()
                .AddEntityFrameworkStores<StoreIdentityDbContext>();

            builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();

            builder
                .Services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.SaveToken = true;
                    options.TokenValidationParameters = new TokenValidationParameters()
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidIssuer = builder.Configuration["JWTOptions:Issuer"],
                        ValidAudience = builder.Configuration["JWTOptions:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["JWTOptions:SecretKey"]!)
                        ),
                        RoleClaimType = ClaimTypes.Role,
                        NameClaimType = ClaimTypes.Name,
                    };
                });

            builder.Services.Configure<OrderFulfillmentOptions>(
                builder.Configuration.GetSection(OrderFulfillmentOptions.SectionName)
            );
            builder.Services.AddScoped<IOrderFulfillmentService, OrderFulfillmentService>();
            builder.Services.AddHostedService<OrderFulfillmentBackgroundService>();

            builder.Services.AddScoped<IOrderService, OrderService>();
            builder.Services.AddScoped<IPaymentService, PaymentService>();
            builder.Services.AddScoped<IAdminService, AdminService>();
            builder.Services.AddScoped<IAdminAiService, AdminAiService>();
            builder.Services.AddScoped<IAuditLogService, AuditLogService>();
            builder.Services.AddScoped<IRecommendationTrackingService, RecommendationTrackingService>();
            builder.Services.AddScoped<IWishlistService, WishlistService>();
            builder.Services.AddScoped<IRecommendationService, RecommendationService>();
            builder.Services.AddScoped<INotificationService, NotificationService>();
            builder.Services.AddScoped<IAccountService, AccountService>();
            builder.Services.AddScoped<ICouponService, CouponService>();
            builder.Services.AddScoped<IInventoryStockService, InventoryStockService>();
            builder.Services.AddScoped<ProductImageStorage>();

            builder.Services.Configure<AiOptions>(builder.Configuration.GetSection(AiOptions.SectionName));
            builder.Services.PostConfigure<AiOptions>(options =>
            {
                var envKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
                if (!string.IsNullOrWhiteSpace(envKey))
                    options.GeminiApiKey = envKey;
            });
            builder.Services.AddHttpClient<GeminiProvider>();
            builder.Services.AddSingleton<IVectorStore, InMemoryVectorStore>();
            builder.Services.AddScoped<IAIProvider>(sp => sp.GetRequiredService<GeminiProvider>());
            builder.Services.AddScoped<IRagService, RagService>();
            builder.Services.AddScoped<IKnowledgeService, KnowledgeService>();
            builder.Services.AddScoped<IAssistantToolExecutor, AssistantToolExecutor>();
            builder.Services.AddScoped<IChatAssistantService, ChatAssistantService>();
            builder.Services.AddScoped<IReviewSummaryService, ReviewSummaryService>();
            builder.Services.AddScoped<IVisualSearchService, VisualSearchService>();
            #endregion



            var app = builder.Build();

            await app.MigrateDataBaseAsync();
            await app.MigratIdentityeDataBaseAsync();

            await app.SeedDataAsync();
            await app.ReconcileInventoryStockAsync();
            await app.SeedIdentityDataAsync();
            await app.SeedNotificationsAsync();
            await AiKnowledgeSeeder.SeedAsync(app.Services);

            #region Configure PipeLine [Middlewares]
            #region Custom Middleware
            // Configure the HTTP request pipeline.

            //app.Use(
            //    async (context, next) =>
            //    {
            //        try
            //        {
            //            await next();
            //        }
            //        catch (Exception ex)
            //        {
            //            Console.WriteLine(ex.Message); //Logging console

            //            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            //            await context.Response.WriteAsJsonAsync(
            //                new
            //                {
            //                    StatusCode = StatusCodes.Status500InternalServerError,
            //                    Error = $"An unexpected error Occured:{ex.Message}",
            //                }
            //            );
            //        }
            //    }
            //);
            #endregion


            app.UseMiddleware<ExceptionHandlerMiddleware>();

            var exposeSwagger =
                app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker");

            if (exposeSwagger)
            {
                app.UseSwagger();
                app.UseSwaggerUI(options =>
                {
                    options.DisplayRequestDuration();
                    options.EnableFilter();
                    options.DocExpansion(DocExpansion.None);
                });
            }

            app.UseStaticFiles();

            var webRoot = app.Environment.WebRootPath
                ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
            Directory.CreateDirectory(Path.Combine(webRoot, "images", "products"));

            if (!app.Environment.IsEnvironment("Docker"))
            {
                app.UseHttpsRedirection();
            }

            app.UseCors("DevelopmentPolicy");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapGet("/", () =>
                exposeSwagger
                    ? Results.Redirect("/swagger")
                    : Results.Ok(new { name = "Corner Store API", api = "/api" })
            );

            app.MapControllers();
            #endregion

            await app.RunAsync();
        }
    }
}
