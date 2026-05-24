package discovery

import (
	"fmt"
	"math/rand"

	"github.com/hashicorp/consul/api"
)

type Registry interface {
	Register(serviceName, serviceID, host string, port int) error
	Deregister(serviceID string) error
	Discover(serviceName string) (string, error)
}

type ConsulRegistry struct {
	client *api.Client
}

func NewConsulRegistry(addr string) (*ConsulRegistry, error) {
	cfg := api.DefaultConfig()
	cfg.Address = addr
	client, err := api.NewClient(cfg) // Исправили error на err (так принято в Go)
	if err != nil {
		return nil, err
	}
	return &ConsulRegistry{client: client}, nil
}

// Register регистрирует текущий сервис (Gateway) в каталоге Consul
func (r *ConsulRegistry) Register(serviceName, serviceID, host string, port int) error {
	registration := &api.AgentServiceRegistration{
		ID:      serviceID,   // Уникальный ID инстанса (например, gateway-1)
		Name:    serviceName, // Имя сервиса для поиска (gateway)
		Address: host,        // Имя хоста или контейнера (gateway)
		Port:    port,        // Порт приложения (8000)
		Check: &api.AgentServiceCheck{
			// Consul будет слать TCP-запрос на этот порт, чтобы проверять жив ли сервис
			TCP:                            fmt.Sprintf("%s:%d", host, port),
			Interval:                       "10s",
			Timeout:                        "5s",
			DeregisterCriticalServiceAfter: "1m",
		},
	}

	return r.client.Agent().ServiceRegister(registration)
}

// Deregister удаляет сервис из Consul при остановке приложения
func (r *ConsulRegistry) Deregister(serviceID string) error {
	return r.client.Agent().ServiceDeregister(serviceID)
}

func (r *ConsulRegistry) Discover(serviceName string) (string, error) {
	services, _, err := r.client.Health().Service(serviceName, "", true, nil)
	if err != nil {
		return "", err
	}

	if len(services) == 0 {
		return "", fmt.Errorf("service %s not found in Consul", serviceName)
	}

	// Базовый балансировщик (Client-side Load Balancing): берем случайный живой инстанс
	idx := rand.Intn(len(services))
	service := services[idx].Service

	return fmt.Sprintf("%s:%d", service.Address, service.Port), nil
}