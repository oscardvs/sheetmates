#!/bin/bash
# Build script for libnest2d WASM module
# Usage: ./build.sh [--docker]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/public/wasm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
USE_DOCKER=false
CLEAN_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            USE_DOCKER=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        -h|--help)
            echo "Usage: ./build.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --docker    Use Docker for build (recommended)"
            echo "  --clean     Clean build directory before building"
            echo "  -h, --help  Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Clone libnest2d if not present
if [ ! -d "$SCRIPT_DIR/vendor/libnest2d" ]; then
    log_info "Cloning libnest2d..."
    mkdir -p "$SCRIPT_DIR/vendor"
    git clone --depth 1 https://github.com/tamasmeszaros/libnest2d.git "$SCRIPT_DIR/vendor/libnest2d"
fi

if [ "$USE_DOCKER" = true ]; then
    log_info "Building with Docker..."
    
    # Check Docker is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker or use native build."
        exit 1
    fi
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -t sheetmates-wasm "$SCRIPT_DIR"
    
    # Run build
    log_info "Running WASM build in container..."
    docker run --rm -v "$OUTPUT_DIR:/output" sheetmates-wasm
    
else
    log_info "Building with native Emscripten..."
    
    # Check Emscripten is available
    if ! command -v emcc &> /dev/null; then
        log_error "Emscripten not found. Please install emsdk or use --docker"
        log_info "See: https://emscripten.org/docs/getting_started/downloads.html"
        exit 1
    fi
    
    BUILD_DIR="$SCRIPT_DIR/build"
    
    # Clean if requested
    if [ "$CLEAN_BUILD" = true ] && [ -d "$BUILD_DIR" ]; then
        log_info "Cleaning build directory..."
        rm -rf "$BUILD_DIR"
    fi
    
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"
    
    # Configure
    log_info "Configuring with CMake..."
    emcmake cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_CXX_FLAGS="-O3 -flto"
    
    # Build
    log_info "Compiling..."
    cmake --build . --parallel
    
    # Copy outputs
    log_info "Copying outputs to $OUTPUT_DIR..."
    cp libnest2d.js "$OUTPUT_DIR/"
    cp libnest2d.wasm "$OUTPUT_DIR/"
fi

log_info "Build complete!"
log_info "Output files:"
ls -lh "$OUTPUT_DIR"/libnest2d.*
