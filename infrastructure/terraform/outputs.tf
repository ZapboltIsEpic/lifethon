# LifeThon Infrastructure - Outputs
# Display important resource information after deployment

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "RDS instance address (without port)"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

# S3 Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for gacha images"
  value       = aws_s3_bucket.gacha_images.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.gacha_images.arn
}

output "s3_bucket_url" {
  description = "URL of the S3 bucket"
  value       = "https://${aws_s3_bucket.gacha_images.bucket}.s3.${var.aws_region}.amazonaws.com"
}

# Auto Scaling Group Outputs
output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.backend.name
}

output "asg_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.backend.arn
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "backend_security_group_id" {
  description = "ID of the backend security group"
  value       = aws_security_group.backend.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.backend.name
}

# Connection Strings (for documentation)
output "database_connection_string" {
  description = "JDBC connection string for the database (without credentials)"
  value       = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
  sensitive   = false
}

output "spring_datasource_url" {
  description = "Spring Boot datasource URL"
  value       = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
}

# Summary Output
output "deployment_summary" {
  description = "Summary of the deployment"
  value = {
    environment         = var.environment
    region             = var.aws_region
    application_url    = "http://${aws_lb.main.dns_name}"
    database_endpoint  = aws_db_instance.postgres.endpoint
    s3_bucket         = aws_s3_bucket.gacha_images.bucket
    asg_desired       = var.asg_desired_capacity
    instance_type     = var.ec2_instance_type
  }
}

# Next Steps
output "next_steps" {
  description = "Next steps after deployment"
  value = <<-EOT
    
    🎉 Infrastructure deployed successfully!
    
    📋 Next Steps:
    
    1. Access your application:
       URL: http://${aws_lb.main.dns_name}
    
    2. Connect to database:
       Host: ${aws_db_instance.postgres.address}
       Port: ${aws_db_instance.postgres.port}
       Database: ${aws_db_instance.postgres.db_name}
       Username: ${var.db_username}
    
    3. Upload gacha images to S3:
       aws s3 cp images/ s3://${aws_s3_bucket.gacha_images.bucket}/images/ --recursive
    
    4. View logs:
       aws logs tail /aws/ec2/${var.project_name}-backend-${var.environment} --follow
    
    5. SSH to an instance (get instance ID from AWS Console):
       aws ssm start-session --target <instance-id>
    
    6. Monitor health:
       Check target group health in AWS Console
       CloudWatch dashboard: https://console.aws.amazon.com/cloudwatch/
    
    📊 Monitoring:
    - CloudWatch Logs: ${aws_cloudwatch_log_group.backend.name}
    - High CPU Alarm: ${aws_cloudwatch_metric_alarm.high_cpu.alarm_name}
    - Unhealthy Hosts Alarm: ${aws_cloudwatch_metric_alarm.unhealthy_hosts.alarm_name}
    
    🔐 Security:
    - Update SSH security group to restrict access
    - Rotate database password regularly
    - Enable AWS WAF on ALB for production
    - Configure HTTPS with ACM certificate
    
  EOT
}
