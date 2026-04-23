pipeline {

    // ─────────────────────────────────────────────────────────────
    // Runs directly on the Jenkins server (no Docker needed)
    // ─────────────────────────────────────────────────────────────
    agent any

    environment {
        // ── Paths on your server (10.10.2.60) ───────────────────
        BACKEND_PATH  = "/home/indhu/zentreeportal/zentreeportal_backend"
        FRONTEND_PATH = "/home/indhu/zentreeportal/zentreeportal_frontend"

        // ── Git ──────────────────────────────────────────────────
        REPO_URL      = "https://github.com/Indu-erakasani/ZentreePortal-App"
        GIT_BRANCH    = "main"

        // ── Env files injected from Jenkins credentials ──────────
        BACKEND_ENV   = credentials('zentree-backend-env')
        FRONTEND_ENV  = credentials('zentree-frontend-env')
    }

    triggers {
        githubPush()   // auto-trigger on every git push
    }

    stages {

        // ─────────────────────────────────────────────────────────
        // STAGE 1 — Pull latest code from GitHub
        // ─────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "========== Pulling code: Build #${env.BUILD_NUMBER} =========="
                git(
                    url: "${REPO_URL}",
                    branch: "${GIT_BRANCH}",
                    credentialsId: 'github-token'
                )
                echo "Code pulled from ${REPO_URL} (branch: ${GIT_BRANCH})"
            }
        }

        // ─────────────────────────────────────────────────────────
        // STAGE 2 — Inject .env files (from Jenkins credentials)
        // ─────────────────────────────────────────────────────────
        stage('Inject Environment Files') {
            steps {
                echo "========== Injecting .env files =========="

                // Copy the secret files into the right folders
                sh "cp ${BACKEND_ENV}  ${WORKSPACE}/zentreeportal_backend/.env"
                sh "cp ${FRONTEND_ENV} ${WORKSPACE}/zentreeportal_frontend/.env"

                echo ".env files injected successfully"
            }
        }

        // ─────────────────────────────────────────────────────────
        // STAGE 3 — Install & Build (Backend + Frontend in parallel)
        // ─────────────────────────────────────────────────────────
        stage('Install & Build') {
            parallel {

                stage('Backend — Python Setup') {
                    steps {
                        echo "========== Backend: Installing Python dependencies =========="
                        dir("${WORKSPACE}/zentreeportal_backend") {
                            sh '''
                                # Create venv only if it doesn't exist
                                if [ ! -d "venv" ]; then
                                    python3 -m venv venv
                                    echo "Virtual environment created"
                                fi

                                # Activate and install dependencies
                                . venv/bin/activate
                                pip install --upgrade pip --quiet
                                pip install -r requirements.txt --quiet
                                echo "Backend dependencies installed"
                            '''
                        }
                    }
                }

                stage('Frontend — React Build') {
                    steps {
                        echo "========== Frontend: Installing and building React =========="
                        dir("${WORKSPACE}/zentreeportal_frontend") {
                            sh '''
                                # Install node modules
                                npm install --silent

                                # Build production bundle
                                npm run build

                                echo "React build complete — output in /build folder"
                            '''
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────
        // STAGE 4 — Run Tests (Backend + Frontend in parallel)
        // ─────────────────────────────────────────────────────────
        stage('Run Tests') {
            parallel {

                stage('Backend — Pytest') {
                    steps {
                        echo "========== Running Flask tests =========="
                        dir("${WORKSPACE}/zentreeportal_backend") {
                            sh '''
                                . venv/bin/activate

                                # Run tests — if no tests folder, skip gracefully
                                if [ -d "tests" ]; then
                                    pytest tests/ -v --junitxml=test-results.xml
                                else
                                    echo "No tests directory found — skipping backend tests"
                                fi
                            '''
                        }
                    }
                    post {
                        always {
                            // Publish pytest results in Jenkins UI
                            script {
                                if (fileExists("${WORKSPACE}/zentreeportal_backend/test-results.xml")) {
                                    junit "${WORKSPACE}/zentreeportal_backend/test-results.xml"
                                }
                            }
                        }
                    }
                }

                stage('Frontend — React Tests') {
                    steps {
                        echo "========== Running React tests =========="
                        dir("${WORKSPACE}/zentreeportal_frontend") {
                            sh '''
                                # CI=true prevents watch mode
                                CI=true npm test -- --watchAll=false --passWithNoTests
                            '''
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────
        // STAGE 5 — Deploy to /home/indhu/zentreeportal/
        //           (only runs when pushing to 'main')
        // ─────────────────────────────────────────────────────────
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo "========== Deploying ZentreePortal =========="

                // ── Deploy Backend ────────────────────────────────
                sh """
                    echo "Syncing backend files..."

                    rsync -av --delete \
                        --exclude='venv/' \
                        --exclude='.env' \
                        --exclude='__pycache__/' \
                        --exclude='*.pyc' \
                        --exclude='uploads/' \
                        ${WORKSPACE}/zentreeportal_backend/ \
                        ${BACKEND_PATH}/

                    # Copy fresh .env to deployed backend
                    cp ${BACKEND_ENV} ${BACKEND_PATH}/.env

                    echo "Backend files synced to ${BACKEND_PATH}"
                """

                // ── Rebuild venv on deployed server ───────────────
                sh """
                    cd ${BACKEND_PATH}
                    if [ ! -d "venv" ]; then
                        python3 -m venv venv
                    fi
                    . venv/bin/activate
                    pip install --upgrade pip --quiet
                    pip install -r requirements.txt --quiet
                    echo "Backend venv ready at ${BACKEND_PATH}"
                """

                // ── Deploy Frontend build ─────────────────────────
                sh """
                    echo "Syncing frontend build..."

                    rsync -av --delete \
                        --exclude='node_modules/' \
                        --exclude='.env' \
                        ${WORKSPACE}/zentreeportal_frontend/build/ \
                        ${FRONTEND_PATH}/build/

                    echo "Frontend build synced to ${FRONTEND_PATH}/build"
                """

                // ── Restart Flask backend via systemctl ───────────
                sh """
                    echo "Restarting Flask service..."
                    sudo systemctl restart zentree-backend

                    # Verify it's running
                    sleep 3
                    if systemctl is-active --quiet zentree-backend; then
                        echo "Flask service is running"
                    else
                        echo "Flask service failed to start!"
                        sudo journalctl -u zentree-backend --no-pager -n 30
                        exit 1
                    fi
                """

                echo "========== Deployment Complete — Build #${env.BUILD_NUMBER} =========="
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST — Notifications + Cleanup
    // ─────────────────────────────────────────────────────────────
    post {
        success {
            echo """
            ✅ ZentreePortal deployed successfully!
               Build   : #${env.BUILD_NUMBER}
               Branch  : ${env.BRANCH_NAME}
               Backend : http://10.10.2.60:5000
               Frontend: http://10.10.2.60:3000
            """
        }
        failure {
            echo "❌ Build #${env.BUILD_NUMBER} failed. Check console output at: ${env.BUILD_URL}"
            mail(
                to: 'outsourcing@zentreelabs.com',
                subject: "❌ ZentreePortal Build FAILED — #${env.BUILD_NUMBER}",
                body: """
                    ZentreePortal build failed.

                    Job    : ${env.JOB_NAME}
                    Build  : #${env.BUILD_NUMBER}
                    Branch : ${env.BRANCH_NAME}
                    Logs   : ${env.BUILD_URL}console

                    Please check the Jenkins console for details.
                """
            )
        }
        always {
            echo "Cleaning Jenkins workspace..."
            cleanWs()
        }
    }
}