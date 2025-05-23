provider "aws" {
  region = "ap-northeast-1"  # Tokyo region for JST timezone
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "employee-coin-app-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["ap-northeast-1a", "ap-northeast-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  single_nat_gateway = true
  
  tags = {
    Environment = "production"
    Project     = "employee-coin-app"
  }
}

resource "aws_security_group" "alb" {
  name        = "employee-coin-app-alb-sg"
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "employee-coin-app-alb-sg"
  }
}

resource "aws_security_group" "ecs" {
  name        = "employee-coin-app-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "employee-coin-app-ecs-sg"
  }
}

resource "aws_security_group" "rds" {
  name        = "employee-coin-app-rds-sg"
  description = "Security group for RDS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "employee-coin-app-rds-sg"
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "employee-coin-app-db-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "employee-coin-app-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "employee-coin-app-db"
  engine                 = "postgres"
  engine_version         = "16.0"
  instance_class         = "db.t3.small"
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = "employee_coin_app"
  username               = "postgres"
  password               = "postgres"  # Use AWS Secrets Manager in production
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = true
  skip_final_snapshot    = true

  tags = {
    Name = "employee-coin-app-db"
  }
}

resource "aws_ecs_cluster" "main" {
  name = "employee-coin-app-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "employee-coin-app-cluster"
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "employee-coin-app-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "DATABASE_URL"
          value = "postgresql://postgres:postgres@${aws_db_instance.postgres.endpoint}/employee_coin_app"
        },
        {
          name  = "PORT"
          value = "8000"
        },
        {
          name  = "FRONTEND_URL"
          value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/employee-coin-app-backend"
          "awslogs-region"        = "ap-northeast-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "employee-coin-app-backend"
  }
}

resource "aws_ecs_service" "backend" {
  name            = "employee-coin-app-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener.backend]

  tags = {
    Name = "employee-coin-app-backend"
  }
}

resource "aws_lb" "backend" {
  name               = "employee-coin-app-backend-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  tags = {
    Name = "employee-coin-app-backend-alb"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "employee-coin-app-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name = "employee-coin-app-backend-tg"
  }
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

resource "aws_s3_bucket" "frontend" {
  bucket = "employee-coin-app-frontend"

  tags = {
    Name = "employee-coin-app-frontend"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3-employee-coin-app-frontend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-employee-coin-app-frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "employee-coin-app-frontend"
  }
}

resource "aws_ecr_repository" "backend" {
  name = "employee-coin-app-backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "employee-coin-app-backend"
  }
}

resource "aws_iam_role" "ecs_execution_role" {
  name = "employee-coin-app-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "employee-coin-app-ecs-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "employee-coin-app-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "employee-coin-app-ecs-task-role"
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/employee-coin-app-backend"
  retention_in_days = 30

  tags = {
    Name = "employee-coin-app-backend-logs"
  }
}

output "backend_alb_dns" {
  value = aws_lb.backend.dns_name
}

output "frontend_url" {
  value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "database_endpoint" {
  value = aws_db_instance.postgres.endpoint
}
