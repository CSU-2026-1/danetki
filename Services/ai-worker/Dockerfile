# ----------------------------------------------------------------
#  AI Worker — multi-stage build
#  Стадия 1: компилируем в большом SDK-образе
#  Стадия 2: копируем артефакты в маленький runtime-образ
# ----------------------------------------------------------------

# --- build stage ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Сначала только csproj — это даёт кэширование слоя dotnet restore,
# если зависимости не менялись.
COPY *.csproj ./
RUN dotnet restore

# Теперь весь исходный код
COPY . .
RUN dotnet publish -c Release -o /app /p:UseAppHost=false

# --- runtime stage ---
FROM mcr.microsoft.com/dotnet/runtime:8.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "Danetka.AiWorker.dll"]
