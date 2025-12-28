# Dockerfile personnalisé pour Jenkins avec Docker, Node.js et Python
FROM jenkins/jenkins:lts

USER root

# Installation de Docker CLI
RUN apt-get update && \
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# Installation de Node.js 18.x et npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Installation de Python 3 et pip
RUN apt-get install -y python3 python3-pip python3-venv

# Installation de Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# Nettoyage
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Copie de la liste des plugins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

# Installation des plugins Jenkins
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

# Permissions pour Docker socket
RUN usermod -aG docker jenkins || true

USER jenkins

# Variables d'environnement
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
ENV DOCKER_HOST="unix:///var/run/docker.sock"
