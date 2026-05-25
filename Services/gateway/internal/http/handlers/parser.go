package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/ingvionio/danetki/internal/contracts/parser"
	"github.com/ingvionio/danetki/internal/discovery"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const parserServiceName = "parser-service"

type ParserHandler struct {
	reg      discovery.Registry
	fallback string
}

func NewParserHandler(reg discovery.Registry, fallback string) *ParserHandler {
	return &ParserHandler{reg: reg, fallback: fallback}
}

func (h *ParserHandler) dial() (*grpc.ClientConn, error) {
	addr := discovery.Resolve(h.reg, parserServiceName, h.fallback)
	return grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
}

func (h *ParserHandler) Start(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Limit     int32  `json:"limit"`
		SourceUrl string `json:"source_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Limit = 0
		req.SourceUrl = ""
	}

	conn, err := h.dial()
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	client := parser.NewParserServiceClient(conn)
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*5)
	defer cancel()

	grpcResp, err := client.StartParsing(ctx, &parser.StartParsingRequest{
		Limit:     req.Limit,
		SourceUrl: req.SourceUrl,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeProtoJSON(w, grpcResp)
}

func (h *ParserHandler) Status(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	jobID := r.URL.Query().Get("job_id")

	conn, err := h.dial()
	if err != nil {
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	client := parser.NewParserServiceClient(conn)
	ctx, cancel := context.WithTimeout(r.Context(), time.Second*5)
	defer cancel()

	grpcResp, err := client.GetStatus(ctx, &parser.GetStatusRequest{JobId: jobID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	writeProtoJSON(w, grpcResp)
}
