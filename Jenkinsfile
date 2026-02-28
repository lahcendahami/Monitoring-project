pipeline{
    agent any
    stages{
        stage('Build') {
            steps {
                echo 'Building...'
                // Add build steps here (e.g., npm install, mvn clean install.....)
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
                // Add test steps here (e.g., npm test, mvn test ...)
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
                // Add deploy steps here (e.g., docker build, kubectl apply ....)
            }
        }
    }
}