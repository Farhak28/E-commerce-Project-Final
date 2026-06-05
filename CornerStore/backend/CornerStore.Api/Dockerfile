FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["CornerStore.Api/CornerStore.Api.csproj", "CornerStore.Api/"]
COPY ["ECommerce.Services/ECommerce.Services.csproj", "ECommerce.Services/"]
COPY ["ECommerce.Services.Abstraction/ECommerce.Services.Abstraction.csproj", "ECommerce.Services.Abstraction/"]
COPY ["ECommerce.Domain/ECommerce.Domain.csproj", "ECommerce.Domain/"]
COPY ["ECommerce.Shared/ECommerce.Shared.csproj", "ECommerce.Shared/"]
COPY ["ECommerce.Persistence/ECommerce.Persistence.csproj", "ECommerce.Persistence/"]
COPY ["ECommerce.Presentation/ECommerce.Presentation.csproj", "ECommerce.Presentation/"]

RUN dotnet restore "CornerStore.Api/CornerStore.Api.csproj"

COPY . .
WORKDIR /src/CornerStore.Api
RUN dotnet publish "CornerStore.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5141
ENV ASPNETCORE_URLS=http://+:5141
ENV ASPNETCORE_ENVIRONMENT=Docker
CMD ["dotnet", "CornerStore.Api.dll"]
