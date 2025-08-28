# Tamagotchi Web App - Makefile

.PHONY: help serve dev install clean test lint format check-deps check-config restart stop

# Default target
help:
	@echo "Tamagotchi Web App - Available Commands:"
	@echo ""
	@echo "  serve     - Start production server on http://localhost:8000"
	@echo "  dev       - Start development server with auto-reload"
	@echo "  restart   - Stop any running server and start fresh"
	@echo "  stop      - Stop any running servers"
	@echo "  install   - Install/sync all dependencies"
	@echo "  clean     - Clean cache and temporary files"
	@echo "  test      - Run basic functionality tests"
	@echo "  lint      - Run code linting (if available)"
	@echo "  format    - Format code (if available)"
	@echo "  check-deps- Check if all dependencies are installed"
	@echo "  check-config - Verify configuration files"
	@echo ""

# Production server
serve: check-deps check-config
	@echo "🚀 Starting Tamagotchi Web App..."
	@echo "📍 Access at: http://localhost:8000"
	@echo "🔄 Press Ctrl+C to stop"
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# Development server with auto-reload
dev: check-deps check-config
	@echo "🛠️  Starting development server..."
	@echo "📍 Access at: http://localhost:8000"
	@echo "🔄 Auto-reload enabled - Press Ctrl+C to stop"
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Install dependencies
install:
	@echo "📦 Installing dependencies with UV..."
	uv sync
	@echo "✅ Dependencies installed successfully"

# Clean temporary files
clean:
	@echo "🧹 Cleaning temporary files..."
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf **/__pycache__
	rm -rf **/**/__pycache__
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info
	find . -name "*.pyc" -delete
	find . -name "*.pyo" -delete
	@echo "✅ Cleanup complete"

# Basic functionality tests
test: check-deps
	@echo "🧪 Running basic functionality tests..."
	@echo "Testing imports..."
	@uv run python -c "from app.main import app; print('✅ FastAPI app import successful')"
	@uv run python -c "from lib.game_logic import GameEngine; print('✅ Game logic import successful')"
	@uv run python -c "from lib.llm_client import TamagotchiLLMClient; print('✅ LLM client import successful')"
	@uv run python -c "from app.models.tamagotchi import TamagotchiState; print('✅ Models import successful')"
	@echo "Testing configuration..."
	@make check-config
	@echo "✅ Basic tests passed"

# Lint code (if linter is available)
lint:
	@echo "🔍 Running code linting..."
	@if command -v ruff >/dev/null 2>&1; then \
		echo "Running Ruff..."; \
		ruff check .; \
	elif uv run python -m flake8 --version >/dev/null 2>&1; then \
		echo "Running Flake8..."; \
		uv run python -m flake8 .; \
	else \
		echo "⚠️  No linter available (install ruff or flake8)"; \
	fi

# Format code (if formatter is available)
format:
	@echo "🎨 Formatting code..."
	@if command -v ruff >/dev/null 2>&1; then \
		echo "Formatting with Ruff..."; \
		ruff format .; \
	elif uv run python -m black --version >/dev/null 2>&1; then \
		echo "Formatting with Black..."; \
		uv run python -m black .; \
	else \
		echo "⚠️  No formatter available (install ruff or black)"; \
	fi

# Check dependencies
check-deps:
	@echo "🔍 Checking dependencies..."
	@if ! command -v uv >/dev/null 2>&1; then \
		echo "❌ UV is not installed. Install from: https://docs.astral.sh/uv/"; \
		exit 1; \
	fi
	@echo "✅ UV is installed"
	@if [ ! -f "uv.lock" ]; then \
		echo "⚠️  No uv.lock found. Run 'make install' first."; \
		exit 1; \
	fi
	@echo "✅ Dependencies lock file found"

# Check configuration
check-config:
	@echo "🔍 Checking configuration..."
	@if [ ! -f "config.yml" ]; then \
		echo "❌ config.yml not found"; \
		echo "Please create config.yml with your Azure OpenAI settings"; \
		exit 1; \
	fi
	@echo "✅ config.yml found"
	@uv run python -c "import yaml; config=yaml.safe_load(open('config.yml')); \
		required=['azure-openai-api-key', 'azure-openai-endpoint', 'azure-openai-api-version', 'model']; \
		missing=[k for k in required if k not in config]; \
		assert not missing, f'Missing config keys: {missing}'; \
		print('✅ Configuration valid')"

# Create .env template (optional)
create-env-template:
	@echo "📝 Creating .env template..."
	@echo "# Azure OpenAI Configuration" > .env.template
	@echo "AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/" >> .env.template
	@echo "AZURE_OPENAI_KEY=your-api-key-here" >> .env.template
	@echo "AZURE_OPENAI_API_VERSION=2024-02-01" >> .env.template
	@echo "MODEL_NAME=gpt-4" >> .env.template
	@echo "" >> .env.template
	@echo "# Tamagotchi Settings" >> .env.template
	@echo "TAMAGOTCHI_UPDATE_INTERVAL=60" >> .env.template
	@echo "TAMAGOTCHI_SAVE_FILE=tamagotchi_save.json" >> .env.template
	@echo "" >> .env.template
	@echo "# Server Settings" >> .env.template
	@echo "HOST=0.0.0.0" >> .env.template
	@echo "PORT=8000" >> .env.template
	@echo "RELOAD=false" >> .env.template
	@echo "✅ .env template created"
	@echo "📋 Copy .env.template to .env and fill in your values"

# Quick setup for new users
setup: install check-config
	@echo "🎉 Setup complete!"
	@echo "Run 'make serve' to start the Tamagotchi!"

# Show status
status:
	@echo "📊 Tamagotchi Web App Status:"
	@echo ""
	@echo "Dependencies:"
	@make check-deps 2>/dev/null && echo "  ✅ UV and dependencies OK" || echo "  ❌ Missing dependencies"
	@echo ""
	@echo "Configuration:"
	@make check-config 2>/dev/null && echo "  ✅ config.yml OK" || echo "  ❌ config.yml issues"
	@echo ""
	@echo "Files:"
	@[ -f "tamagotchi_save.json" ] && echo "  📁 Save file exists" || echo "  📁 No save file (will create new Tamagotchi)"
	@[ -d "web" ] && echo "  🌐 Web files present" || echo "  ❌ Missing web directory"
	@echo ""
	@echo "Ready to run: make serve"

# Development helpers
dev-reset: clean
	@echo "🔄 Resetting development environment..."
	@rm -f tamagotchi_save.json
	@echo "✅ Development reset complete"

# Stop any running servers (helpful for development)
stop:
	@echo "🛑 Stopping any running servers..."
	@pkill -f "uvicorn.*app.main:app" || echo "No running servers found"
	@echo "✅ Servers stopped"

# Restart server (stop + serve)
restart: stop
	@echo "🔄 Restarting Tamagotchi Web App..."
	@sleep 2
	@make serve