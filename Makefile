SHELL := /bin/bash

BACKEND_DIR := $(CURDIR)/src/backend
FRONTEND_DIR := $(CURDIR)/src/frontend
MINIAPP_DIR := $(CURDIR)/src/telegram-miniapp
BOT_DIR := $(CURDIR)/src/telegram-bot
CERTS_DIR := $(BACKEND_DIR)/certs

.PHONY: help sync lint test build up down stop logs run

help:
	@echo " "
	@echo "Targets:"
	@echo "  sync            - Sync locally project dependencies with UV"
	@echo "  lint            - Run all project code linting"
	@echo "  test            - Run all project tests"
	@echo "  keys            - Generate RSA keys for JWT auth"
	@echo " "
	@echo "  build           - Build docker containers (use SERVICE=... to build a specific service)"
	@echo "  up              - Start containers (use SERVICE=... to start a specific service)"
	@echo "  down            - Stop and remove containers (use SERVICE=... to stop and remove a specific service)"
	@echo "  stop            - Stop running containers (use SERVICE=... to stop a specific service)"
	@echo "  logs            - View containers logs (use SERVICE=... to specific containers logs and/or LOGS_TAIL=... to set logs length)"
	@echo " "

sync:
	cd $(BACKEND_DIR) && pip install uv && uv sync
	cd $(BOT_DIR) && pip install uv && uv sync
	cd $(FRONTEND_DIR) && npm install --silent
	cd $(MINIAPP_DIR) && npm install --silent
	@echo " "
	@echo "Dependencies synced!"

lint:
	cd $(BACKEND_DIR) && uv run pre-commit run --all-files
	@echo " "
	@echo "Linting completed!"

test:
	cd $(BACKEND_DIR) && uv run pytest
	cd $(FRONTEND_DIR) && npm test -- --run
	@echo " "
	@echo "Tests completed!"

keys:
	@mkdir -p $(CERTS_DIR)
	openssl genrsa -out $(CERTS_DIR)/jwt-private.pem 2048
	openssl rsa -in $(CERTS_DIR)/jwt-private.pem -outform PEM -pubout -out $(CERTS_DIR)/jwt-public.pem
	@echo " "
	@echo "Keys generated in $(CERTS_DIR)!"

SERVICE ?=

build:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose build $(SERVICE); \
	else \
		docker compose build; \
	fi
	@echo " "
	@echo "Build completed!"

up:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose up -d --remove-orphans $(SERVICE); \
	else \
		docker compose up -d --remove-orphans; \
	fi
	@echo " "
	@echo "Containers started!"

down:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose stop $(SERVICE) || true; \
		docker compose rm -f $(SERVICE) || true; \
	else \
		docker compose down; \
	fi
	@echo " "
	@echo "Containers stopped and removed!"

stop:
	@if [ -n "$(SERVICE)" ]; then \
		docker compose stop $(SERVICE); \
	else \
		docker compose stop; \
	fi
	@echo " "
	@echo "Containers stopped!"

LOGS_TAIL ?=

logs:
	@if [ -n "$(SERVICE)" ] && [ -n "$(LOGS_TAIL)" ]; then \
  		echo " " \
  		echo "Showing last $(LOGS_TAIL) lines from service: $(SERVICE)"; \
  		echo " " \
		docker compose logs -f --tail=$(LOGS_TAIL) $(SERVICE); \
	elif [ -n "$(SERVICE)" ]; then \
	  	echo " " \
	  	echo "Following logs from service: $(SERVICE)"; \
  		echo " " \
		docker compose logs -f $(SERVICE); \
	elif [ -n "$(LOGS_TAIL)" ]; then \
	    echo " " \
	  	echo "Showing last $(LOGS_TAIL) lines from all services"; \
		echo " " \
		docker compose logs -f --tail=$(LOGS_TAIL); \
	else \
	  	echo " " \
	  	echo "Following logs from all services"; \
		echo " " \
		docker compose logs -f; \
	fi
