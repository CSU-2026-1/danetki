# ----------------------------------------------------------------
#  AI Worker — multi-stage build
#
#  ВАЖНО: этот Dockerfile собирается с context=. (корень репо),
#  потому что AiWorker.csproj ссылается на ../../contracts/puzzle.proto
#  для gRPC-кодогенерации. См. build.context в docker-compose.yml.
#
#  Папка Services с большой буквы — git так её зафиксировал.
# ----------------------------------------------------------------

# --- build stage ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Слой 1: только csproj — это даёт кэширование dotnet restore,
# если зависимости не менялись.
COPY Services/ai-worker/AiWorker.csproj Services/ai-worker/
RUN dotnet restore Services/ai-worker/AiWorker.csproj

# Слой 2: исходники + протоколы
COPY Services/ai-worker/ Services/ai-worker/
COPY contracts/ contracts/

RUN dotnet publish Services/ai-worker/AiWorker.csproj \
    -c Release -o /app /p:UseAppHost=false

# --- runtime stage ---
FROM mcr.microsoft.com/dotnet/runtime:8.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "Danetka.AiWorker.dll"]
