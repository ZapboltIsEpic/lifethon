#!/bin/bash
# LifeThon Backend - EC2 User Data Script
# This script runs on instance launch to set up the application

set -e  # Exit on any error

# Log everything
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "========================================="
echo "LifeThon Backend Setup - Starting"
echo "Environment: ${environment}"
echo "========================================="

# Update system
echo "Updating system packages..."
dnf update -y

# Install required packages
echo "Installing required packages..."
dnf install -y \
    java-21-amazon-corretto \
    postgresql15 \
    git \
    wget \
    unzip \
    amazon-cloudwatch-agent

# Install AWS CLI v2
echo "Installing AWS CLI..."
if ! command -v aws &> /dev/null; then
    cd /tmp
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
fi

# Create application user
echo "Creating application user..."
if ! id -u lifethon &>/dev/null; then
    useradd -r -s /bin/bash -d /opt/lifethon lifethon
fi

# Create application directories
echo "Creating application directories..."
mkdir -p /opt/lifethon/{app,logs,config}
chown -R lifethon:lifethon /opt/lifethon

# Download and setup application
echo "Setting up application..."
cd /opt/lifethon/app

# TODO: Replace with your actual JAR location (S3 bucket, artifact repository, etc.)
# For now, we'll assume you've uploaded the JAR to S3
# aws s3 cp s3://your-artifacts-bucket/lifethon.jar /opt/lifethon/app/lifethon.jar

# Create application.properties from template
cat > /opt/lifethon/config/application.properties <<EOF
spring.application.name=lifethon

# Database Configuration
spring.datasource.url=jdbc:postgresql://${db_endpoint}/${db_name}
spring.datasource.username=${db_username}
spring.datasource.password=${db_password}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate Properties
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Connection Pool Settings
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000

# Server Configuration
server.port=8081

# JWT Configuration (use AWS Secrets Manager in production)
jwt.secret=production-secret-key-must-be-at-least-256-bits-long-change-this-immediately
jwt.expiration=86400000

# S3 Configuration
aws.s3.bucket=${s3_bucket}
aws.region=${aws_region}

# Logging
logging.level.root=INFO
logging.level.com.example.lifethon=DEBUG
logging.file.name=/opt/lifethon/logs/application.log
logging.file.max-size=10MB
logging.file.max-history=7
EOF

chown lifethon:lifethon /opt/lifethon/config/application.properties
chmod 600 /opt/lifethon/config/application.properties

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/lifethon.service <<EOF
[Unit]
Description=LifeThon Backend Service
After=network.target

[Service]
Type=simple
User=lifethon
Group=lifethon
WorkingDirectory=/opt/lifethon/app
ExecStart=/usr/bin/java \\
    -Xms512m \\
    -Xmx1024m \\
    -XX:+UseG1GC \\
    -XX:MaxGCPauseMillis=200 \\
    -jar /opt/lifethon/app/lifethon.jar \\
    --spring.config.location=/opt/lifethon/config/application.properties

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lifethon

# Security settings
NoNewPrivileges=true
PrivateTmp=true

# Environment
Environment="JAVA_HOME=/usr/lib/jvm/java-21-amazon-corretto"
Environment="SPRING_PROFILES_ACTIVE=${environment}"

[Install]
WantedBy=multi-user.target
EOF

# Configure CloudWatch Agent
echo "Configuring CloudWatch Agent..."
cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/opt/lifethon/logs/application.log",
            "log_group_name": "/aws/ec2/lifethon-backend-${environment}",
            "log_stream_name": "{instance_id}/application.log",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/lifethon-backend-${environment}",
            "log_stream_name": "{instance_id}/user-data.log",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "LifeThon/Backend",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch Agent
echo "Starting CloudWatch Agent..."
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h ${db_endpoint} -p 5432 -U ${db_username}; do
    echo "Database not ready, waiting..."
    sleep 5
done
echo "Database is ready!"

# Enable and start the service
echo "Enabling and starting LifeThon service..."
systemctl daemon-reload
# systemctl enable lifethon.service
# systemctl start lifethon.service

# Note: Service start is commented out because JAR file needs to be deployed first
# Use deployment script or CI/CD pipeline to deploy JAR and start service

# Create health check script
cat > /opt/lifethon/health-check.sh <<'SCRIPT'
#!/bin/bash
# Health check script for monitoring

HEALTH_URL="http://localhost:8081/api/gacha/info"
MAX_RETRIES=3
RETRY_DELAY=2

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" | grep -q "200"; then
        echo "Health check passed"
        exit 0
    fi
    echo "Health check attempt $i failed, retrying..."
    sleep $RETRY_DELAY
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1
SCRIPT

chmod +x /opt/lifethon/health-check.sh

# Setup log rotation
echo "Configuring log rotation..."
cat > /etc/logrotate.d/lifethon <<EOF
/opt/lifethon/logs/*.log {
    daily
    rotate 7
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
}
EOF

# Create deployment script
cat > /opt/lifethon/deploy.sh <<'DEPLOY'
#!/bin/bash
# Deployment script - run this to deploy new versions

set -e

JAR_URL=$1
if [ -z "$JAR_URL" ]; then
    echo "Usage: $0 <jar-s3-url>"
    echo "Example: $0 s3://my-bucket/lifethon-v1.0.0.jar"
    exit 1
fi

echo "Downloading new version from $JAR_URL..."
aws s3 cp "$JAR_URL" /tmp/lifethon-new.jar

echo "Stopping service..."
systemctl stop lifethon.service || true

echo "Backing up current version..."
if [ -f /opt/lifethon/app/lifethon.jar ]; then
    cp /opt/lifethon/app/lifethon.jar /opt/lifethon/app/lifethon.jar.backup
fi

echo "Installing new version..."
mv /tmp/lifethon-new.jar /opt/lifethon/app/lifethon.jar
chown lifethon:lifethon /opt/lifethon/app/lifethon.jar

echo "Starting service..."
systemctl enable lifethon.service
systemctl start lifethon.service

echo "Waiting for application to start..."
sleep 10

echo "Checking health..."
/opt/lifethon/health-check.sh

echo "Deployment complete!"
DEPLOY

chmod +x /opt/lifethon/deploy.sh

echo "========================================="
echo "LifeThon Backend Setup - Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Deploy JAR file: /opt/lifethon/deploy.sh s3://your-bucket/lifethon.jar"
echo "2. Check logs: journalctl -u lifethon.service -f"
echo "3. Check health: /opt/lifethon/health-check.sh"
echo ""
echo "Service status: systemctl status lifethon.service"
echo "View logs: tail -f /opt/lifethon/logs/application.log"
echo ""
