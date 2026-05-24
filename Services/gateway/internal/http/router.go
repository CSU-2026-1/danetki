package http

import (
	"net/http"

	"github.com/ingvionio/danetki/internal/discovery"
	"github.com/ingvionio/danetki/internal/http/handlers"
	"github.com/ingvionio/danetki/internal/http/middleware"
)

func NewRouter(reg discovery.Registry) http.Handler {
	mux := http.NewServeMux()

	authHandler := handlers.NewAuthHandler(reg)
	puzzleHandler := handlers.NewPuzzleHandler(reg)
	parserHandler := handlers.NewParserHandler(reg)

	// Инициализируем мидлварь авторизации
	authMiddleware := middleware.AuthMiddleware(reg)

	// 1. ПУБЛИЧНЫЕ МАРШРУТЫ (Доступны всем без токена)
	mux.HandleFunc("/auth/register", authHandler.Register)
	mux.HandleFunc("/auth/login", authHandler.Login)

	// 2. ПРИВАТНЫЕ МАРШРУТЫ (Оборачиваем конкретные хэндлеры в authMiddleware)
	// Для хэндлеров на базе HandleFunc используем http.HandlerFunc( ... ) для приведения типов
	mux.Handle("/puzzle/", authMiddleware(http.HandlerFunc(puzzleHandler.HandlePuzzle)))

	mux.Handle("/parser/start", authMiddleware(http.HandlerFunc(parserHandler.Start)))
	mux.Handle("/parser/status", authMiddleware(http.HandlerFunc(parserHandler.Status)))

	// Возвращаем чистый mux, глобально защищать ничего больше не нужно
	return mux
}