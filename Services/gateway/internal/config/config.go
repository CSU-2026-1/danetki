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
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	consulAddr := os.Getenv("CONSUL_ADDR")
	if consulAddr == "" {
		consulAddr = "consul:8500" // Внутри Docker-сети достучимся по имени сервиса
	}

	// Парсим порт в int для Consul. Если что-то пойдет не так, бахнем дефолтные 8000
	p, err := strconv.Atoi(port)
	if err != nil {
		p = 8000
	}

	return &Config{
		Port:        port,
		ConsulAddr:  consulAddr,
		ServiceName: "gateway",
		ServiceID:   "gateway-1",
		ServiceHost: "gateway", // Имя контейнера в docker-compose
		ServicePort: p,
	}
}