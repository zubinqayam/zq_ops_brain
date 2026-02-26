#!/bin/bash
# ZQ Ops Brain - Build Script
# Usage: ./build.sh [android|desktop|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_TYPE="${1:-all}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed."; exit 1; }
    command -v cargo >/dev/null 2>&1 || { log_error "Rust/Cargo is required but not installed."; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    cd "$PROJECT_ROOT"
    npm ci
    log_success "Dependencies installed"
}

# Build Android APK
build_android() {
    log_info "Building Android APK..."
    
    cd "$PROJECT_ROOT/src-tauri"
    
    # Check for Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        log_warn "ANDROID_HOME not set. Attempting to find Android SDK..."
        if [ -d "$HOME/Android/Sdk" ]; then
            export ANDROID_HOME="$HOME/Android/Sdk"
        elif [ -d "/usr/lib/android-sdk" ]; then
            export ANDROID_HOME="/usr/lib/android-sdk"
        else
            log_error "Android SDK not found. Please set ANDROID_HOME."
            exit 1
        fi
        log_info "Found Android SDK at $ANDROID_HOME"
    fi
    
    # Build with Tauri
    log_info "Building with Tauri..."
    npm run tauri android build -- --release
    
    log_success "Android APK built successfully"
    log_info "Output: $PROJECT_ROOT/src-tauri/gen/android/app/build/outputs/apk/release/"
}

# Build Desktop (Windows via cross-compilation)
build_desktop() {
    log_info "Building Desktop executable..."
    
    cd "$PROJECT_ROOT"
    
    # Build with Tauri
    log_info "Building with Tauri..."
    npm run tauri build
    
    log_success "Desktop executable built successfully"
    log_info "Output: $PROJECT_ROOT/src-tauri/target/release/bundle/"
}

# Sign configuration
sign_config() {
    log_info "Signing configuration..."
    
    CONFIG_FILE="$PROJECT_ROOT/config.zq"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Configuration file not found: $CONFIG_FILE"
        log_info "Copy from template: cp config.zq.template config.zq"
        exit 1
    fi
    
    if [ ! -f "$SCRIPT_DIR/config.key" ]; then
        log_warn "Signing key not found. Generating new key pair..."
        openssl genpkey -algorithm ed25519 -out "$SCRIPT_DIR/config.key"
        openssl pkey -in "$SCRIPT_DIR/config.key" -pubout -out "$SCRIPT_DIR/config.pub"
        log_info "Public key saved to: $SCRIPT_DIR/config.pub"
        log_warn "Add this public key to your config.zq security.public_key field"
    fi
    
    # Sign the config
    openssl pkeyutl -sign -in "$CONFIG_FILE" -inkey "$SCRIPT_DIR/config.key" -out "$CONFIG_FILE.sig"
    
    log_success "Configuration signed: $CONFIG_FILE.sig"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Frontend tests
    npm run test || { log_error "Frontend tests failed."; exit 1; }
    
    # Rust tests
    cd src-tauri
    cargo test --release
    
    log_success "Tests completed"
}

# Package for distribution
package() {
    log_info "Packaging for distribution..."
    
    VERSION=$(grep '^version' "$PROJECT_ROOT/config.zq" | cut -d'"' -f2)
    PACKAGE_DIR="$PROJECT_ROOT/dist/zq-ops-brain-$VERSION"
    
    mkdir -p "$PACKAGE_DIR"
    
    # Copy artifacts
    if [ -d "$PROJECT_ROOT/src-tauri/gen/android/app/build/outputs/apk/release" ]; then
        cp "$PROJECT_ROOT/src-tauri/gen/android/app/build/outputs/apk/release/"*.apk "$PACKAGE_DIR/" 2>/dev/null || true
    fi
    
    if [ -d "$PROJECT_ROOT/src-tauri/target/release/bundle" ]; then
        cp "$PROJECT_ROOT/src-tauri/target/release/bundle/msi/"*.msi "$PACKAGE_DIR/" 2>/dev/null || true
        cp "$PROJECT_ROOT/src-tauri/target/release/bundle/nsis/"*.exe "$PACKAGE_DIR/" 2>/dev/null || true
    fi
    
    # Copy documentation
    cp "$PROJECT_ROOT/README.md" "$PACKAGE_DIR/" 2>/dev/null || true
    cp "$PROJECT_ROOT/LICENSE" "$PACKAGE_DIR/" 2>/dev/null || true
    
    log_success "Packaged to: $PACKAGE_DIR"
}

# Main build process
main() {
    echo -e "${GREEN}====================================${NC}"
    echo -e "${GREEN}  ZQ Ops Brain Build System${NC}"
    echo -e "${GREEN}====================================${NC}"
    echo ""
    
    check_prerequisites
    install_deps
    
    case "$BUILD_TYPE" in
        android)
            build_android
            ;;
        desktop)
            build_desktop
            ;;
        all)
            build_android
            build_desktop
            sign_config
            package
            ;;
        test)
            run_tests
            ;;
        sign)
            sign_config
            ;;
        *)
            echo "Usage: $0 [android|desktop|all|test|sign]"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}====================================${NC}"
    echo -e "${GREEN}  Build completed successfully!${NC}"
    echo -e "${GREEN}====================================${NC}"
}

main "$@"
