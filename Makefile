BUN := $(shell which bun 2>/dev/null || echo ~/.bun/bin/bun)
FRONTEND := frontend
BACKEND := backend
OUT := out
TARGET ?= native

# Determine output suffix based on target
ifeq ($(TARGET),bun-darwin-arm64)
  SUFFIX := mac-arm64
else ifeq ($(TARGET),bun-darwin-x64)
  SUFFIX := mac-x64
else ifeq ($(TARGET),bun-linux-x64)
  SUFFIX := linux-x64
else ifeq ($(TARGET),bun-linux-arm64)
  SUFFIX := linux-arm64
else
  SUFFIX := $(shell uname -s | tr A-Z a-z)-$(shell uname -m)
endif

OUTFILE := $(OUT)/excalidraw-server-$(SUFFIX)

.PHONY: all dev build embed compile rebuild update-deps clean run status mac-arm mac-intel

# ── Default: cross-compile for current platform ────────────────
all: clean build embed compile
	@$(MAKE) status

# ── Dev build (no clean, no compile) ───────────────────────────
dev: build embed
	@echo "🎉 Dev build ready. Run: make run"

# ── Build frontend (Vite) ──────────────────────────────────────
build:
	@echo "🔨 Building frontend..."
	@cd $(FRONTEND) && $(BUN) install 2>&1 | tail -1
	@cd $(FRONTEND) && $(BUN) run build 2>&1 | tail -1
	@rm -rf $(BACKEND)/public
	@cp -r $(FRONTEND)/dist $(BACKEND)/public
	@echo "✅ Frontend built"

# ── Regenerate embedded files ──────────────────────────────────
embed:
	@echo "📦 Embedding static files..."
	@cd $(BACKEND) && $(BUN) run embed.ts 2>&1
	@echo "✅ files.embed.ts generated"

# ── Compile server binary for $(TARGET) ────────────────────────
compile:
	@echo "⚡ Compiling for $(TARGET)..."
	@mkdir -p $(OUT)
	@cd $(BACKEND) && $(BUN) build --compile \
		$(if $(filter-out native,$(TARGET)),--target $(TARGET)) \
		--outfile ../$(OUTFILE) \
		server.ts
	@echo "✅ $(OUTFILE)"

# ── Full rebuild ───────────────────────────────────────────────
rebuild: clean build embed compile
	@$(MAKE) status

# ── Update @excalidraw/excalidraw to latest ───────────────────
update-deps:
	@echo "📦 Updating @excalidraw/excalidraw to latest..."
	@cd $(FRONTEND) && $(BUN) update @excalidraw/excalidraw
	@echo "✅ Updated. Run 'make rebuild' to build."

# ── Clean generated files ──────────────────────────────────────
clean:
	@echo "🧹 Cleaning..."
	@rm -rf $(FRONTEND)/dist $(BACKEND)/public $(BACKEND)/files.embed.ts $(OUT)
	@echo "✅ Cleaned"

# ── Run development server ────────────────────────────────────
run:
	@echo "🚀 Starting dev server..."
	@cd $(BACKEND) && $(BUN) server.ts

# ── Mac shortcuts ──────────────────────────────────────────────
mac-arm:
	@$(MAKE) rebuild TARGET=bun-darwin-arm64

mac-intel:
	@$(MAKE) rebuild TARGET=bun-darwin-x64

# ── Status ─────────────────────────────────────────────────────
status:
	@echo "📋 Excalidraw Multi-Project — Bun Binary"
	@echo ""
	@echo "   Platform:    $(SUFFIX)"
	@test -f $(OUTFILE) && echo "   Binary:      ✅ $(OUTFILE)" || echo "   Binary:      ❌ not compiled"
	@ls $(OUT)/excalidraw-server-* 2>/dev/null | sed 's/^.*\///' | while read f; do echo "                 📄 $$f"; done
	@echo "   Frontend:    $(FRONTEND)/src/"
	@echo "   Backend:     $(BACKEND)/server.ts"
	@echo "   Bun:         $(BUN)"
	@echo ""
	@echo "   Commands:"
	@echo "     make               rebuild for current platform"
	@echo "     make dev            rebuild (keep old binary)"
	@echo "     make mac-arm        rebuild for Apple Silicon Mac"
	@echo "     make mac-intel      rebuild for Intel Mac"
	@echo "     make update-deps   update @excalidraw/excalidraw"
	@echo "     make run           dev server"
	@echo "     make clean         remove generated files"
