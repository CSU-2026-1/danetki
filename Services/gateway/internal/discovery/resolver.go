package discovery

import "log"

// Resolve пытается найти адрес сервиса через Consul, при неудаче
// возвращает fallback (адрес из env / docker-compose).
// Это позволяет Gateway работать пока сервисы ещё не научились
// регистрироваться в Consul самостоятельно.
func Resolve(reg Registry, serviceName, fallback string) string {
	if reg == nil {
		return fallback
	}
	addr, err := reg.Discover(serviceName)
	if err != nil || addr == "" {
		log.Printf("discovery: fallback to %q for service %q (err=%v)", fallback, serviceName, err)
		return fallback
	}
	return addr
}
