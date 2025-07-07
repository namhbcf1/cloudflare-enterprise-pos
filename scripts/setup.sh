#!/bin/bash

# =====================================================
# ENTERPRISE POS SYSTEM - AUTO SETUP SCRIPT
# Sets up the complete POS system on Cloudflare
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="enterprise-pos"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
NODE_VERSION="18"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_header "CHECKING SYSTEM REQUIREMENTS"
    
    # Check Node.js
    if command_exists node; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            print_success "Node.js $(node --version) is installed"
        else
            print_error "Node.js version $NODE_VERSION or higher is required. Current: $(node --version)"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js $NODE_VERSION or higher."
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        print_success "npm $(npm --version) is installed"
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check git
    if command_exists git; then
        print_success "Git $(git --version | cut -d' ' -f3) is installed"
    else
        print_warning "Git is not installed. Some features may not work."
    fi
    
    # Check wrangler CLI
    if command_exists wrangler; then
        print_success "Wrangler $(wrangler --version | cut -d' ' -f2) is installed"
    else
        print_warning "Wrangler CLI not found. Installing..."
        npm install -g wrangler@latest
        print_success "Wrangler CLI installed"
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    print_header "INSTALLING DEPENDENCIES"
    
    # Backend dependencies
    if [ -d "$BACKEND_DIR" ]; then
        print_status "Installing backend dependencies..."
        cd $BACKEND_DIR
        
        if [ -f "package.json" ]; then
            npm install
            print_success "Backend dependencies installed"
        else
            print_error "Backend package.json not found"
            exit 1
        fi
        
        cd ..
    else
        print_error "Backend directory not found"
        exit 1
    fi
    
    # Frontend dependencies
    if [ -d "$FRONTEND_DIR" ]; then
        print_status "Installing frontend dependencies..."
        cd $FRONTEND_DIR
        
        if [ -f "package.json" ]; then
            npm install
            print_success "Frontend dependencies installed"
        else
            print_error "Frontend package.json not found"
            exit 1
        fi
        
        cd ..
    else
        print_error "Frontend directory not found"
        exit 1
    fi
    
    # Root dependencies (if any)
    if [ -f "package.json" ]; then
        print_status "Installing root dependencies..."
        npm install
        print_success "Root dependencies installed"
    fi
    
    echo ""
}

# Cloudflare authentication
cloudflare_auth() {
    print_header "CLOUDFLARE AUTHENTICATION"
    
    # Check if already authenticated
    if wrangler whoami >/dev/null 2>&1; then
        CURRENT_USER=$(wrangler whoami 2>/dev/null | grep "You are logged in" | cut -d' ' -f6 || echo "unknown")
        print_success "Already authenticated as: $CURRENT_USER"
        
        read -p "$(echo -e ${YELLOW}Do you want to re-authenticate? [y/N]: ${NC})" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            wrangler logout
            wrangler login
        fi
    else
        print_status "Please authenticate with Cloudflare..."
        print_status "This will open a browser window for authentication."
        read -p "$(echo -e ${YELLOW}Press Enter to continue...${NC})"
        
        wrangler login
        
        if wrangler whoami >/dev/null 2>&1; then
            print_success "Successfully authenticated with Cloudflare"
        else
            print_error "Cloudflare authentication failed"
            exit 1
        fi
    fi
    
    echo ""
}

# Create Cloudflare resources
create_cloudflare_resources() {
    print_header "CREATING CLOUDFLARE RESOURCES"
    
    cd $BACKEND_DIR
    
    # Create D1 Database
    print_status "Creating D1 database..."
    if wrangler d1 list | grep -q "$PROJECT_NAME-db"; then
        print_warning "D1 database '$PROJECT_NAME-db' already exists"
        DB_ID=$(wrangler d1 list | grep "$PROJECT_NAME-db" | awk '{print $2}')
    else
        DB_OUTPUT=$(wrangler d1 create "$PROJECT_NAME-db" 2>&1)
        if echo "$DB_OUTPUT" | grep -q "Created D1 database"; then
            DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | cut -d'"' -f4)
            print_success "D1 database created with ID: $DB_ID"
        else
            print_error "Failed to create D1 database"
            echo "$DB_OUTPUT"
            exit 1
        fi
    fi
    
    # Create KV namespaces
    print_status "Creating KV namespaces..."
    
    # Cache namespace
    if wrangler kv:namespace list | grep -q "$PROJECT_NAME-cache"; then
        print_warning "KV namespace '$PROJECT_NAME-cache' already exists"
    else
        CACHE_KV_OUTPUT=$(wrangler kv:namespace create "$PROJECT_NAME-cache" 2>&1)
        if echo "$CACHE_KV_OUTPUT" | grep -q "Success"; then
            CACHE_KV_ID=$(echo "$CACHE_KV_OUTPUT" | grep "id" | cut -d'"' -f4)
            print_success "Cache KV namespace created with ID: $CACHE_KV_ID"
        else
            print_error "Failed to create cache KV namespace"
            exit 1
        fi
    fi
    
    # Sessions namespace
    if wrangler kv:namespace list | grep -q "$PROJECT_NAME-sessions"; then
        print_warning "KV namespace '$PROJECT_NAME-sessions' already exists"
    else
        SESSIONS_KV_OUTPUT=$(wrangler kv:namespace create "$PROJECT_NAME-sessions" 2>&1)
        if echo "$SESSIONS_KV_OUTPUT" | grep -q "Success"; then
            SESSIONS_KV_ID=$(echo "$SESSIONS_KV_OUTPUT" | grep "id" | cut -d'"' -f4)
            print_success "Sessions KV namespace created with ID: $SESSIONS_KV_ID"
        else
            print_error "Failed to create sessions KV namespace"
            exit 1
        fi
    fi
    
    # Settings namespace
    if wrangler kv:namespace list | grep -q "$PROJECT_NAME-settings"; then
        print_warning "KV namespace '$PROJECT_NAME-settings' already exists"
    else
        SETTINGS_KV_OUTPUT=$(wrangler kv:namespace create "$PROJECT_NAME-settings" 2>&1)
        if echo "$SETTINGS_KV_OUTPUT" | grep -q "Success"; then
            SETTINGS_KV_ID=$(echo "$SETTINGS_KV_OUTPUT" | grep "id" | cut -d'"' -f4)
            print_success "Settings KV namespace created with ID: $SETTINGS_KV_ID"
        else
            print_error "Failed to create settings KV namespace"
            exit 1
        fi
    fi
    
    # Create R2 bucket
    print_status "Creating R2 bucket..."
    if wrangler r2 bucket list | grep -q "$PROJECT_NAME-storage"; then
        print_warning "R2 bucket '$PROJECT_NAME-storage' already exists"
    else
        if wrangler r2 bucket create "$PROJECT_NAME-storage" >/dev/null 2>&1; then
            print_success "R2 bucket '$PROJECT_NAME-storage' created"
        else
            print_error "Failed to create R2 bucket"
            exit 1
        fi
    fi
    
    cd ..
    echo ""
}

# Update configuration files
update_config() {
    print_header "UPDATING CONFIGURATION FILES"
    
    # Update wrangler.toml with actual resource IDs
    print_status "Updating wrangler.toml..."
    
    cd $BACKEND_DIR
    
    # Get actual resource IDs
    if [ -z "$DB_ID" ]; then
        DB_ID=$(wrangler d1 list | grep "$PROJECT_NAME-db" | awk '{print $2}')
    fi
    
    if [ -z "$CACHE_KV_ID" ]; then
        CACHE_KV_ID=$(wrangler kv:namespace list | grep "$PROJECT_NAME-cache" | awk '{print $2}')
    fi
    
    if [ -z "$SESSIONS_KV_ID" ]; then
        SESSIONS_KV_ID=$(wrangler kv:namespace list | grep "$PROJECT_NAME-sessions" | awk '{print $2}')
    fi
    
    if [ -z "$SETTINGS_KV_ID" ]; then
        SETTINGS_KV_ID=$(wrangler kv:namespace list | grep "$PROJECT_NAME-settings" | awk '{print $2}')
    fi
    
    # Update wrangler.toml
    if [ -f "wrangler.toml" ]; then
        # Backup original
        cp wrangler.toml wrangler.toml.backup
        
        # Update database ID
        sed -i.tmp "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
        
        # Update KV IDs
        sed -i.tmp "s/id = \"your-kv-cache-id\"/id = \"$CACHE_KV_ID\"/" wrangler.toml
        sed -i.tmp "s/id = \"your-kv-sessions-id\"/id = \"$SESSIONS_KV_ID\"/" wrangler.toml  
        sed -i.tmp "s/id = \"your-kv-settings-id\"/id = \"$SETTINGS_KV_ID\"/" wrangler.toml
        
        # Clean up temp files
        rm -f wrangler.toml.tmp
        
        print_success "wrangler.toml updated with resource IDs"
    else
        print_error "wrangler.toml not found"
        exit 1
    fi
    
    cd ..
    
    # Generate JWT secret
    print_status "Generating JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    
    # Generate encryption key
    ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" | cut -c1-32)
    
    print_success "Security keys generated"
    
    echo ""
}

# Initialize database
init_database() {
    print_header "INITIALIZING DATABASE"
    
    cd $BACKEND_DIR
    
    # Run migrations
    print_status "Running database migrations..."
    if [ -f "database/schema.sql" ]; then
        if wrangler d1 execute "$PROJECT_NAME-db" --file=database/schema.sql >/dev/null 2>&1; then
            print_success "Database schema created"
        else
            print_error "Failed to create database schema"
            exit 1
        fi
    else
        print_error "Database schema file not found"
        exit 1
    fi
    
    # Seed database
    print_status "Seeding database with sample data..."
    if [ -f "database/seed.sql" ]; then
        if wrangler d1 execute "$PROJECT_NAME-db" --file=database/seed.sql >/dev/null 2>&1; then
            print_success "Database seeded with sample data"
        else
            print_warning "Failed to seed database (continuing anyway)"
        fi
    else
        print_warning "Database seed file not found"
    fi
    
    cd ..
    echo ""
}

# Deploy backend
deploy_backend() {
    print_header "DEPLOYING BACKEND"
    
    cd $BACKEND_DIR
    
    print_status "Deploying Worker to Cloudflare..."
    if wrangler publish >/dev/null 2>&1; then
        WORKER_URL=$(wrangler publish 2>&1 | grep "Published" | cut -d' ' -f2 || echo "")
        if [ -z "$WORKER_URL" ]; then
            WORKER_URL="https://$PROJECT_NAME-backend.your-subdomain.workers.dev"
        fi
        print_success "Backend deployed to: $WORKER_URL"
    else
        print_error "Failed to deploy backend"
        exit 1
    fi
    
    cd ..
    echo ""
}

# Deploy frontend
deploy_frontend() {
    print_header "DEPLOYING FRONTEND"
    
    cd $FRONTEND_DIR
    
    # Update API URL in frontend config
    print_status "Updating frontend configuration..."
    if [ -f "src/config/api.js" ]; then
        sed -i.tmp "s|API_URL.*|API_URL: '$WORKER_URL',|" src/config/api.js
        rm -f src/config/api.js.tmp
    fi
    
    # Build frontend
    print_status "Building frontend..."
    if npm run build >/dev/null 2>&1; then
        print_success "Frontend built successfully"
    else
        print_error "Failed to build frontend"
        exit 1
    fi
    
    # Deploy to Cloudflare Pages
    print_status "Deploying to Cloudflare Pages..."
    if wrangler pages publish dist --project-name="$PROJECT_NAME-frontend" >/dev/null 2>&1; then
        FRONTEND_URL="https://$PROJECT_NAME-frontend.pages.dev"
        print_success "Frontend deployed to: $FRONTEND_URL"
    else
        print_error "Failed to deploy frontend"
        exit 1
    fi
    
    cd ..
    echo ""
}

# Create admin user
create_admin_user() {
    print_header "SETTING UP ADMIN USER"
    
    print_status "Admin user credentials are already seeded in the database:"
    echo -e "  ${CYAN}Email:${NC} admin@pos.com"
    echo -e "  ${CYAN}Password:${NC} admin123"
    echo ""
    print_warning "Please change the admin password after first login!"
    echo ""
}

# Display final information
show_final_info() {
    print_header "SETUP COMPLETE!"
    
    echo -e "${GREEN}🎉 Enterprise POS System is now ready!${NC}"
    echo ""
    
    echo -e "${CYAN}📱 Frontend URL:${NC} $FRONTEND_URL"
    echo -e "${CYAN}🔧 Backend API:${NC} $WORKER_URL"
    echo ""
    
    echo -e "${CYAN}👤 Admin Login:${NC}"
    echo -e "   Email: admin@pos.com"
    echo -e "   Password: admin123"
    echo ""
    
    echo -e "${CYAN}📊 Demo Users:${NC}"
    echo -e "   Staff: john.staff@pos.com / staff123"
    echo -e "   Cashier: mike.cashier@pos.com / cashier123"
    echo ""
    
    echo -e "${CYAN}🗄️ Database:${NC} $PROJECT_NAME-db (ID: $DB_ID)"
    echo -e "${CYAN}🗃️ Storage:${NC} $PROJECT_NAME-storage"
    echo ""
    
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Visit the frontend URL and login as admin"
    echo "2. Change the default admin password"
    echo "3. Configure store settings in the admin panel"
    echo "4. Add your products and customize categories"
    echo "5. Train your staff on the POS system"
    echo ""
    
    echo -e "${YELLOW}🔧 Development:${NC}"
    echo "- Run 'cd $BACKEND_DIR && npm run dev' for backend development"
    echo "- Run 'cd $FRONTEND_DIR && npm run dev' for frontend development"
    echo "- Use 'wrangler d1 execute $PROJECT_NAME-db --command=\"SELECT * FROM users\"' to query database"
    echo ""
    
    echo -e "${GREEN}✨ Enjoy your new Enterprise POS System!${NC}"
}

# Cleanup function
cleanup() {
    print_warning "Setup interrupted. Cleaning up..."
    # Add cleanup logic here if needed
    exit 1
}

# Trap signals for cleanup
trap cleanup INT TERM

# Main execution
main() {
    clear
    echo -e "${PURPLE}"
    echo "  ███████ ███    ██ ████████ ███████ ██████  ██████  ██████  ██ ███████ ███████ "
    echo "  ██      ████   ██    ██    ██      ██   ██ ██   ██ ██   ██ ██ ██      ██      "
    echo "  █████   ██ ██  ██    ██    █████   ██████  ██████  ██████  ██ ███████ █████   "
    echo "  ██      ██  ██ ██    ██    ██      ██   ██ ██      ██   ██ ██      ██ ██      "
    echo "  ███████ ██   ████    ██    ███████ ██   ██ ██      ██   ██ ██ ███████ ███████ "
    echo ""
    echo "                     ██████   ██████  ███████     ███████ ██    ██ ███████ ████████ ███████ ███    ███ "
    echo "                     ██   ██ ██    ██ ██          ██       ██  ██  ██         ██    ██      ████  ████ "
    echo "                     ██████  ██    ██ ███████     ███████   ████   ███████    ██    █████   ██ ████ ██ "
    echo "                     ██      ██    ██      ██          ██    ██         ██    ██    ██      ██  ██  ██ "
    echo "                     ██       ██████  ███████     ███████    ██    ███████    ██    ███████ ██      ██ "
    echo -e "${NC}"
    echo ""
    echo -e "${BLUE}🚀 100% FREE Enterprise POS System on Cloudflare Edge${NC}"
    echo -e "${BLUE}⚡ React + Workers + D1 + KV + R2 + AI${NC}"
    echo ""
    
    # Ask for confirmation
    read -p "$(echo -e ${YELLOW}Ready to set up your Enterprise POS System? [Y/n]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_status "Setup cancelled by user"
        exit 0
    fi
    
    # Run setup steps
    check_requirements
    install_dependencies
    cloudflare_auth
    create_cloudflare_resources
    update_config
    init_database
    deploy_backend
    deploy_frontend
    create_admin_user
    show_final_info
}

# Run main function
main "$@"