pipeline {

    agent any

    environment {
        BACKEND_PATH  = "/home/indhu/zentreeportal/zentreeportal_backend"
        FRONTEND_PATH = "/home/indhu/zentreeportal/zentreeportal_frontend"
        REPO_URL      = "https://github.com/Indu-erakasani/ZentreePortal-App"
        GIT_BRANCH    = "main"
        BACKEND_ENV   = credentials('zentree-backend-env')
        FRONTEND_ENV  = credentials('zentree-frontend-env')
        PATH          = "/usr/local/bin:/usr/bin:/bin:/snap/bin"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                echo "========== Pulling latest code — Build #${env.BUILD_NUMBER} =========="
                git(
                    url: "${REPO_URL}",
                    branch: "${GIT_BRANCH}",
                    credentialsId: 'github-token'
                )
            }
        }

        stage('Inject Environment Files') {
            steps {
                echo "========== Injecting .env files =========="
                sh "cp ${BACKEND_ENV}  ${WORKSPACE}/zentreeportal_backend/.env"
                sh "cp ${FRONTEND_ENV} ${WORKSPACE}/zentreeportal_frontend/.env"
                echo ".env files injected"
            }
        }

        stage('Install & Build') {
            parallel {

                stage('Backend — Python Setup') {
                    steps {
                        echo "========== Backend: Installing dependencies =========="
                        dir("${WORKSPACE}/zentreeportal_backend") {
                            sh '''
                                export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
                                if [ ! -d "venv" ]; then
                                    python3 -m venv venv
                                    echo "Virtual environment created"
                                fi
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
                        echo "========== Frontend: Installing and building =========="
                        dir("${WORKSPACE}/zentreeportal_frontend") {
                            sh '''
                                export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
                                echo "Node version: $(node --version)"
                                echo "NPM version:  $(npm --version)"
                                npm install --silent
                                DISABLE_ESLINT_PLUGIN=true CI=false npm run build
                                echo "React build complete"
                            '''
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            parallel {

                stage('Backend — Pytest') {
                    steps {
                        echo "========== Running Flask tests =========="
                        dir("${WORKSPACE}/zentreeportal_backend") {
                            sh '''
                                export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
                                . venv/bin/activate
                                if [ -d "tests" ]; then
                                    pytest tests/ -v --junitxml=test-results.xml
                                else
                                    echo "No tests directory found — skipping"
                                fi
                            '''
                        }
                    }
                    post {
                        always {
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
                        // dir("${WORKSPACE}/zentreeportal_frontend") {
                        //     sh '''
                        //         export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
                        //         CI=true npm test -- --watchAll=false --passWithNoTests --forceExit
                        //     '''
                        // }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo "========== Deploying ZentreePortal =========="

                sh """
                    export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
                    echo "Syncing backend..."
                    rsync -av --delete \
                        --no-owner --no-group --omit-dir-times \
                        --exclude='venv/' \
                        --exclude='.env' \
                        --exclude='__pycache__/' \
                        --exclude='*.pyc' \
                        --exclude='uploads/' \
                        ${WORKSPACE}/zentreeportal_backend/ \
                        ${BACKEND_PATH}/

                    cp ${BACKEND_ENV} ${BACKEND_PATH}/.env
                    echo "Backend synced"
                """

                sh """
                    export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
                    cd ${BACKEND_PATH}
                    if [ ! -d "venv" ]; then
                        python3 -m venv venv
                    fi
                    . venv/bin/activate
                    pip install --upgrade pip --quiet
                    pip install -r requirements.txt --quiet
                    echo "Backend venv ready"
                """

                sh """
                    export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
                    echo "Syncing frontend build..."
                    rsync -av --delete \
                        --no-owner --no-group --omit-dir-times \
                        --exclude='node_modules/' \
                        --exclude='.env' \
                        ${WORKSPACE}/zentreeportal_frontend/build/ \
                        ${FRONTEND_PATH}/build/
                    echo "Frontend synced"
                """

                sh """
                    echo "Restarting Flask service..."
                    sudo systemctl restart zentree-backend
                    sleep 3
                    if systemctl is-active --quiet zentree-backend; then
                        echo "Flask is running"
                
                else                        echo "Flask failed to start!"
                        sudo journalctl -u zentree-backend --no-pager -n 30
                        exit 1
                    fi
                """

                echo "========== Deployment Complete — Build #${env.BUILD_NUMBER} =========="
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} succeeded!"
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} FAILED — ${env.BUILD_URL}"
        }
        always {
            echo "Cleaning workspace..."
            cleanWs()
        }
    }
}