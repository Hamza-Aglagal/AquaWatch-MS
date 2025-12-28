pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'AquaWatch-MS'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "Checking out ${PROJECT_NAME}..."
                checkout scm
            }
        }
        
        stage('Build All Services') {
            parallel {
                stage('Service Capteurs') {
                    steps {
                        build job: 'service_capteurs', wait: true
                    }
                }
                
                stage('Service Alertes') {
                    steps {
                        build job: 'service_alertes', wait: true
                    }
                }
                
                stage('Service API-SIG') {
                    steps {
                        build job: 'service_api_sig', wait: true
                    }
                }
                
                stage('Service Satellite') {
                    steps {
                        build job: 'service_satellite', wait: true
                    }
                }
                
                stage('Service STModel') {
                    steps {
                        build job: 'service_stmodel', wait: true
                    }
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                echo 'Running integration tests...'
                sh '''
                    echo "Testing inter-service communication..."
                    # Add integration tests here
                '''
            }
        }
        
        stage('Deploy All') {
            steps {
                echo 'Deploying all services...'
                sh '''
                    docker-compose up -d
                '''
            }
        }
    }
    
    post {
        success {
            echo "✅ ${PROJECT_NAME} - All services built and deployed successfully!"
        }
        failure {
            echo "❌ ${PROJECT_NAME} - Build or deployment failed!"
        }
        always {
            echo 'Pipeline completed.'
        }
    }
}
