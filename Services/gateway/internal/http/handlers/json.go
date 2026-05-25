package handlers

import (
	"net/http"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

// jsonMarshaler настроен под человекочитаемый JSON для клиентов:
// - enum как строки ("STATUS_RUNNING"), а не числа
// - пропускать поля со значениями по умолчанию выключено,
//   чтобы клиент получал предсказуемую форму ответа
var jsonMarshaler = protojson.MarshalOptions{
	UseProtoNames:   true,
	EmitUnpopulated: true,
}

func writeProtoJSON(w http.ResponseWriter, msg proto.Message) {
	data, err := jsonMarshaler.Marshal(msg)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(data)
}
