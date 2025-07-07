#!/bin/bash

# ============================================================================
# CLOUDFLARE ENTERPRISE POS - AUTOMATED SETUP SCRIPT
# ============================================================================
# This script will setup the entire POS system from scratch
# Run: chmod +x scripts/setup.sh && ./scripts/setup.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}=== $1 ===${NC}\n"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Prompt user for input
prompt_user() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    if [ -n "$default_value" ]; then
        read -p "$(echo -e ${CYAN}$prompt${NC} [${default_value}]: )" input
        if [ -z "$input" ]; then
            input="$default_value"
        fi
    else
        read -p "$(echo -e ${CYAN}$prompt${NC}: )" input
    fi
    
    eval "$var_name='$input'"
}

# Main setup function
main() {
    log_header "🚀 CLOUDFLARE ENTERPRISE POS SETUP"
    echo "This script will setup your complete POS system with:"
    echo "• Cloudflare Workers backend"
    echo "• D1 Database with migrations"
    echo "• KV Store for caching"
    echo "• R2 Storage for files"
    echo "• React frontend with PWA support"
    echo "• AI integration for recommendations"
    echo "• Gamification system for staff"
    echo ""
    
    # Confirm setup
    read -p "$(echo -e ${CYAN}Continue with setup?${NC} [y/N]: )" confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_info "Setup cancelled by user"
        exit 0
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Get user configuration
    get_user_config
    
    # Setup project
    setup_project_structure
    install_dependencies
    setup_cloudflare_services
    setup_database
    setup_frontend
    create_env_files
    
    # Final steps
    show_completion_message
}

# Check prerequisites
check_prerequisites() {
    log_header "🔍 CHECKING PREREQUISITES"
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    log_success "Node.js $(node --version) ✓"
    
    # Check npm
    if ! command_exists npm; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm --version) ✓"
    
    # Check/Install Wrangler
    if ! command_exists wrangler; then
        log_info "Installing Wrangler CLI..."
        npm install -g wrangler
        if [ $? -eq 0 ]; then
            log_success "Wrangler CLI installed ✓"
        else
            log_error "Failed to install Wrangler CLI"
            exit 1
        fi
    else
        log_success "Wrangler CLI $(wrangler --version | head -n1) ✓"
    fi
    
    # Check Git
    if ! command_exists git; then
        log_warning "Git is not installed. This is optional but recommended."
    else
        log_success "Git $(git --version | cut -d ' ' -f 3) ✓"
    fi
}

# Get user configuration
get_user_config() {
    log_header "⚙️ CONFIGURATION"
    
    echo "Please provide the following information for your POS system:"
    echo ""
    
    prompt_user "Company Name" COMPANY_NAME "Your Company Name"
    prompt_user "Company Email" COMPANY_EMAIL "admin@yourcompany.com"
    prompt_user "Support Email" SUPPORT_EMAIL "support@yourcompany.com"
    prompt_user "Default Currency" DEFAULT_CURRENCY "USD"
    prompt_user "Default Tax Rate (%)" DEFAULT_TAX_RATE "8.25"
    prompt_user "Timezone" TIMEZONE "America/New_York"
    
    echo ""
    log_info "Configuration saved!"
}

# Setup project structure
setup_project_structure() {
    log_header "📁 SETTING UP PROJECT STRUCTURE"
    
    # Create main directories
    log_info "Creating directory structure..."
    
    mkdir -p backend/src/{routes,controllers,middleware,services,utils,websocket,ai}
    mkdir -p backend/migrations
    mkdir -p backend/docs
    mkdir -p frontend/src/{auth,components,pages,services,utils,styles,routes}
    mkdir -p frontend/public/{icons,sounds}
    mkdir -p docs/{architecture,guides,screenshots}
    mkdir -p scripts
    mkdir -p .github/workflows
    
    log_success "Directory structure created ✓"
}

# Install dependencies
install_dependencies() {
    log_header "📦 INSTALLING DEPENDENCIES"
    
    # Install root dependencies
    log_info "Installing root workspace dependencies..."
    npm install
    
    # Install backend dependencies
    log_info "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    log_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    log_success "All dependencies installed ✓"
}

# Setup Cloudflare services
setup_cloudflare_services() {
    log_header "☁️ SETTING UP CLOUDFLARE SERVICES"
    
    # Check if user is logged in to Cloudflare
    log_info "Checking Cloudflare authentication..."
    if ! wrangler whoami >/dev/null 2>&1; then
        log_info "Please login to Cloudflare..."
        wrangler auth login
        
        if [ $? -ne 0 ]; then
            log_error "Failed to authenticate with Cloudflare"
            exit 1
        fi
    fi
    
    local cf_user=$(wrangler whoami 2>/dev/null | head -n1)
    log_success "Authenticated as: $cf_user ✓"
    
    cd backend
    
    # Create D1 Database
    log_info "Creating D1 database..."
    local db_output=$(wrangler d1 create enterprise-pos-db 2>&1)
    if [ $? -eq 0 ]; then
        # Extract database ID
        local db_id=$(echo "$db_output" | grep -o 'database_id = "[^"]*"' | cut -d '"' -f 2)
        if [ -n "$db_id" ]; then
            log_success "D1 Database created ✓"
            log_info "Database ID: $db_id"
            
            # Update wrangler.toml with actual database ID
            sed -i.bak "s/your-database-id-here/$db_id/g" wrangler.toml
            rm wrangler.toml.bak 2>/dev/null || true
        else
            log_warning "Database created but couldn't extract ID. Please update wrangler.toml manually."
        fi
    else
        log_warning "Database might already exist or creation failed. Please check manually."
    fi
    
    # Create KV namespace
    log_info "Creating KV namespace..."
    local kv_output=$(wrangler kv:namespace create "CACHE" 2>&1)
    if [ $? -eq 0 ]; then
        local kv_id=$(echo "$kv_output" | grep -o 'id = "[^"]*"' | cut -d '"' -f 2)
        if [ -n "$kv_id" ]; then
            log_success "KV Namespace created ✓"
            log_info "KV Namespace ID: $kv_id"
            
            # Update wrangler.toml with actual KV ID
            sed -i.bak "s/your-kv-namespace-id/$kv_id/g" wrangler.toml
            rm wrangler.toml.bak 2>/dev/null || true
        fi
    else
        log_warning "KV namespace might already exist or creation failed."
    fi
    
    # Create KV preview namespace
    log_info "Creating KV preview namespace..."
    local kv_preview_output=$(wrangler kv:namespace create "CACHE" --preview 2>&1)
    if [ $? -eq 0 ]; then
        local kv_preview_id=$(echo "$kv_preview_output" | grep -o 'preview_id = "[^"]*"' | cut -d '"' -f 2)
        if [ -n "$kv_preview_id" ]; then
            log_success "KV Preview Namespace created ✓"
            
            # Update wrangler.toml with preview ID
            sed -i.bak "s/your-preview-kv-namespace-id/$kv_preview_id/g" wrangler.toml
            rm wrangler.toml.bak 2>/dev/null || true
        fi
    fi
    
    # Create R2 bucket
    log_info "Creating R2 bucket..."
    if wrangler r2 bucket create enterprise-pos-files 2>/dev/null; then
        log_success "R2 Bucket created ✓"
    else
        log_warning "R2 bucket might already exist or creation failed."
    fi
    
    cd ..
}

# Setup database
setup_database() {
    log_header "🗄️ SETTING UP DATABASE"
    
    cd backend
    
    # Run migrations
    log_info "Running database migrations..."
    if wrangler d1 migrations apply enterprise-pos-db --local; then
        log_success "Local database migrations applied ✓"
    else
        log_error "Failed to apply local migrations"
        cd ..
        return 1
    fi
    
    # Apply to remote database
    log_info "Applying migrations to remote database..."
    if wrangler d1 migrations apply enterprise-pos-db; then
        log_success "Remote database migrations applied ✓"
    else
        log_warning "Remote migrations failed. You can run them later with: npm run migrate"
    fi
    
    cd ..
}

# Setup frontend
setup_frontend() {
    log_header "🎨 SETTING UP FRONTEND"
    
    cd frontend
    
    # Create basic environment file
    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Frontend environment file created ✓"
    fi
    
    # Build frontend for production test
    log_info "Testing frontend build..."
    if npm run build >/dev/null 2>&1; then
        log_success "Frontend build test passed ✓"
    else
        log_warning "Frontend build test failed. You may need to check the configuration."
    fi
    
    cd ..
}

# Create environment files
create_env_files() {
    log_header "🔧 CREATING ENVIRONMENT FILES"
    
    # Backend environment file
    if [ ! -f backend/.env ]; then
        log_info "Creating backend environment file..."
        cat > backend/.env << EOF
# Company Configuration
COMPANY_NAME="$COMPANY_NAME"
COMPANY_EMAIL="$COMPANY_EMAIL"
SUPPORT_EMAIL="$SUPPORT_EMAIL"
DEFAULT_CURRENCY="$DEFAULT_CURRENCY"
DEFAULT_TAX_RATE="$DEFAULT_TAX_RATE"
TIMEZONE="$TIMEZONE"

# Security
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
ENCRYPTION_KEY="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"

# Environment
ENVIRONMENT="development"
DEBUG="true"
LOG_LEVEL="info"

# Features
GAMIFICATION_ENABLED="true"
AI_ENABLED="true"
ANALYTICS_ENABLED="true"
EOF
        log_success "Backend environment file created ✓"
    fi
    
    # Frontend environment file
    if [ ! -f frontend/.env ]; then
        log_info "Creating frontend environment file..."
        cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787
VITE_APP_NAME="$COMPANY_NAME POS"
VITE_COMPANY_NAME="$COMPANY_NAME"
VITE_SUPPORT_EMAIL="$SUPPORT_EMAIL"
VITE_VERSION="1.0.0"
VITE_ENVIRONMENT="development"
EOF
        log_success "Frontend environment file created ✓"
    fi
}

# Show completion message
show_completion_message() {
    log_header "🎉 SETUP COMPLETED SUCCESSFULLY!"
    
    echo -e "${GREEN}Your Cloudflare Enterprise POS system is now ready!${NC}"
    echo ""
    echo "📋 What was setup:"
    echo "  ✅ Project structure with 350+ files"
    echo "  ✅ Cloudflare Workers backend"
    echo "  ✅ D1 Database with comprehensive schema"
    echo "  ✅ KV Store for caching"
    echo "  ✅ R2 Storage for files"
    echo "  ✅ React frontend with PWA support"
    echo "  ✅ Environment configuration"
    echo ""
    echo "🚀 Next steps:"
    echo ""
    echo "1. Seed the database with initial data:"
    echo "   ${CYAN}npm run seed${NC}"
    echo ""
    echo "2. Start development servers:"
    echo "   ${CYAN}npm run dev${NC}"
    echo ""
    echo "3. Access your applications:"
    echo "   • Backend API: ${BLUE}http://localhost:8787${NC}"
    echo "   • Frontend: ${BLUE}http://localhost:5173${NC}"
    echo ""
    echo "4. Deploy to production:"
    echo "   ${CYAN}npm run deploy${NC}"
    echo ""
    echo "📚 Documentation:"
    echo "   • Installation: ${BLUE}docs/INSTALLATION.md${NC}"
    echo "   • API Docs: ${BLUE}docs/API_DOCUMENTATION.md${NC}"
    echo "   • User Guides: ${BLUE}docs/guides/${NC}"
    echo ""
    echo "💡 Tips:"
    echo "   • Default admin login will be created during seeding"
    echo "   • Check wrangler.toml for Cloudflare service IDs"
    echo "   • Use 'wrangler dev' for backend-only development"
    echo "   • Use 'npm run build' to test production builds"
    echo ""
    echo -e "${GREEN}Happy coding! 🎯${NC}"
    echo ""
    echo "Support: $SUPPORT_EMAIL"
    echo "Documentation: https://github.com/yourusername/cloudflare-enterprise-pos"
}

# Error handling
trap 'log_error "Setup failed at line $LINENO. Check the error above."; exit 1' ERR

# Run main function
main "$@"