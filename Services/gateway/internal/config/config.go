package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port        string
	ConsulAddr  string
	ServiceName string
	ServiceID   string
	ServiceHost string
	ServicePort int

	AuthServiceAddr   string
	PuzzleServiceAddr string
	ParserServiceAddr string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	consulAddr := os.Getenv("CONSUL_ADDR")
	if consulAddr == "" {
		consulAddr = "consul:8500"
	}

	p, err := strconv.Atoi(port)
	if err != nil {
		p = 8000
	}

	return &Config{
		Port:        port,
		ConsulAddr:  consulAddr,
		ServiceName: "gateway",
		ServiceID:   "gateway-1",
		ServiceHost: "gateway",
		ServicePort: p,

		AuthServiceAddr:   getEnv("AUTH_SERVICE_ADDR", "auth-service:50051"),
		PuzzleServiceAddr: getEnv("PUZZLE_SERVICE_ADDR", "puzzle-service:50052"),
		ParserServiceAddr: getEnv("PARSER_SERVICE_ADDR", "parser-service:50053"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
