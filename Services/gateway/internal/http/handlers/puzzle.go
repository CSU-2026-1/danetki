package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/ingvionio/danetki/internal/contracts/puzzle"
	"github.com/ingvionio/danetki/internal/discovery"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const puzzleServiceName = "puzzle-service"

type PuzzleHandler struct {
	reg      discovery.Registry
	fallback string
}

func NewPuzzleHandler(reg discovery.Registry, fallback string) *PuzzleHandler {
	return &PuzzleHandler{reg: reg, fallback: fallback}
}

func (h *PuzzleHandler) HandlePuzzle(w http.ResponseWriter, r *http.Request) {
	addr := discovery.Resolve(h.reg, puzzleServiceName, h.fallback)

	conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	client := puzzle.NewPuzzleServiceClient(conn)
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*5)
	defer cancel()

	if r.Method == http.MethodGet && r.URL.Path == "/puzzle/random" {
		grpcResp, err := client.GetRandomPuzzle(ctx, &puzzle.GetRandomPuzzleRequest{})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		writeProtoJSON(w, grpcResp)
		return
	}

	if r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/puzzle/") {
		id := strings.TrimPrefix(r.URL.Path, "/puzzle/")
		if id == "" {
			http.Error(w, "Missing puzzle ID", http.StatusBadRequest)
			return
		}

		grpcResp, err := client.GetPuzzleById(ctx, &puzzle.GetPuzzleByIdRequest{PuzzleId: id})
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		writeProtoJSON(w, grpcResp)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}
