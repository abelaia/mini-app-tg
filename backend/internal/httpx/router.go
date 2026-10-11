package httpx

import (
	"net/http"
	"os"
	"path/filepath"
)

type Module interface {
	Register(r *Router)
}

type Router struct {
	mux  *http.ServeMux
	auth Middleware
}

func NewRouter(auth Middleware) *Router {
	return &Router{mux: http.NewServeMux(), auth: auth}
}

func (r *Router) Public(pattern string, h http.HandlerFunc) {
	r.mux.Handle(pattern, h)
}

func (r *Router) Private(pattern string, h http.HandlerFunc) {
	r.mux.Handle(pattern, r.auth(h))
}

func (r *Router) Mount(modules ...Module) {
	for _, m := range modules {
		m.Register(r)
	}
}

func (r *Router) Static(dir string) {
	if dir == "" {
		return
	}
	files := http.FileServer(http.Dir(dir))
	r.mux.HandleFunc("GET /", func(w http.ResponseWriter, req *http.Request) {
		path := filepath.Join(dir, filepath.Clean(req.URL.Path))
		if info, err := os.Stat(path); err != nil || info.IsDir() {
			http.ServeFile(w, req, filepath.Join(dir, "index.html"))
			return
		}
		files.ServeHTTP(w, req)
	})
}

func (r *Router) Handler() http.Handler {
	return r.mux
}
