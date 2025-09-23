// Jenkinsfile for Frontend Project (vben-admin Monorepo)

pipeline {
    // 1. 定义构建环境 (与后端相同)
    agent {
        docker {
            image 'docker:26-cli'
            args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    // 2. 定义环境变量 (已修改)
    environment {
        REGISTRY              = 'rgc318'
        IMAGE_NAME            = 'ai-recipes-frontend-antd' // 修改为前端镜像名
        SERVER_USER           = 'vivy'
        SERVER_IP             = '192.168.31.229'
        SERVER_PROJECT_PATH   = '/srv/ai_recipes/frontend' // 修改为前端部署路径
        SERVER_CREDENTIALS_ID = 'server-ssh-key'
    }

    // 3. 定义构建阶段
    stages {
        stage('Welcome') {
            steps {
                echo "🚀 Starting CI/CD pipeline for frontend image: ${env.REGISTRY}/${env.IMAGE_NAME}..."
            }
        }

        stage('Build Frontend Image') {
            steps {
                script {
                    env.IMAGE_TAG = "build-${BUILD_NUMBER}"
                    env.IMAGE_FILENAME = "${env.IMAGE_NAME}-${env.IMAGE_TAG}.tar"
                }

                // 关键修改：使用 -f 标志来指定子目录中的 Dockerfile，并使用根目录作为构建上下文
                sh "docker build -t ${env.REGISTRY}/${env.IMAGE_NAME}:${env.IMAGE_TAG} -f ./apps/web-antd/Dockerfile ."

                sh "docker tag ${env.REGISTRY}/${env.IMAGE_NAME}:${env.IMAGE_TAG} ${env.REGISTRY}/${env.IMAGE_NAME}:latest"

                echo "--- Packaging image into ${env.IMAGE_FILENAME} ---"
                sh "docker save -o ${env.IMAGE_FILENAME} ${env.REGISTRY}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent (credentials: [env.SERVER_CREDENTIALS_ID]) {
                    // 传输镜像包和 docker-compose.yml
                    sh "scp -o StrictHostKeyChecking=no ./${env.IMAGE_FILENAME} ${env.SERVER_USER}@${env.SERVER_IP}:${env.SERVER_PROJECT_PATH}/${env.IMAGE_FILENAME}"
                    sh "scp -o StrictHostKeyChecking=no ./docker-compose.yml ${env.SERVER_USER}@${env.SERVER_IP}:${env.SERVER_PROJECT_PATH}/docker-compose.yml"

                    // 远程执行部署脚本
                    sh """
                        ssh -o 'StrictHostKeyChecking=no' ${env.SERVER_USER}@${env.SERVER_IP} 'bash -s' << 'EOF'
                            set -e # 如果任何命令失败，立即退出脚本

                            echo "✅ Successfully logged into the server!"
                            echo "--- Changing directory to: ${env.SERVER_PROJECT_PATH} ---"
                            cd ${env.SERVER_PROJECT_PATH}

                            echo "--- Loading image from ${env.IMAGE_FILENAME} ---"
                            docker load -i ${env.IMAGE_FILENAME}

                            echo "--- Removing transferred tarball to save space ---"
                            rm ${env.IMAGE_FILENAME}

                            echo "--- Restarting service with the new image ---"
                            docker compose up -d --remove-orphans frontend # 注意：这里的服务名可能需要根据前端的 docker-compose.yml 修改

                            echo "--- Pruning old, unused Docker images ---"
                            docker image prune -af

                            echo "🎉 Deployment successful!"
EOF
                    """
                }
            }
        }
    }

    // 4. 定义构建后操作 (与后端相同)
    post {
        always {
            echo "--- Cleaning up workspace ---"
            sh "rm -f *.tar"
        }
    }
}
