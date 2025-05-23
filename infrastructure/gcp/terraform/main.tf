# Terraform configuration for PropFlow on Google Cloud Platform
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.84"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.84"
    }
  }
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com"
  ])

  service = each.key
  disable_on_destroy = false
}

# VPC Network for private services
resource "google_compute_network" "propflow_vpc" {
  name                    = "propflow-vpc"
  auto_create_subnetworks = false
  depends_on             = [google_project_service.apis]
}

resource "google_compute_subnetwork" "propflow_subnet" {
  name          = "propflow-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.propflow_vpc.id
}

# Global address for private IP allocation
resource "google_compute_global_address" "private_ip_allocation" {
  name          = "propflow-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.propflow_vpc.id
}

# Private connection for Cloud SQL
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.propflow_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_allocation.name]
}

# Cloud SQL Instance
resource "google_sql_database_instance" "propflow_db" {
  name             = "propflow-db-${var.environment}"
  database_version = "POSTGRES_14"
  region           = var.region
  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-f1-micro"
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.propflow_vpc.id
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }
}

# Cloud SQL Databases
resource "google_sql_database" "databases" {
  for_each = toset([
    "propflow_auth",
    "propflow_properties",
    "propflow_tenants",
    "propflow_payments",
    "propflow_notifications",
    "propflow_maintenance",
    "propflow_bookings",
    "propflow_ai"
  ])

  name     = each.key
  instance = google_sql_database_instance.propflow_db.name
}

# Cloud SQL User
resource "google_sql_user" "propflow_user" {
  name     = "propflow"
  instance = google_sql_database_instance.propflow_db.name
  password = random_password.db_password.result
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Redis Instance
resource "google_redis_instance" "propflow_redis" {
  name           = "propflow-redis-${var.environment}"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region

  authorized_network = google_compute_network.propflow_vpc.id
  redis_version      = "REDIS_6_X"

  depends_on = [google_project_service.apis]
}

# Cloud Storage Bucket
resource "google_storage_bucket" "propflow_storage" {
  name     = "${var.project_id}-propflow-storage-${var.environment}"
  location = var.region

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# IAM for Cloud Storage
resource "google_storage_bucket_iam_member" "propflow_storage_access" {
  bucket = google_storage_bucket.propflow_storage.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.propflow_services.email}"
}

# Service Account for Cloud Run services
resource "google_service_account" "propflow_services" {
  account_id   = "propflow-services"
  display_name = "PropFlow Services"
  description  = "Service account for PropFlow microservices"
}

# IAM roles for the service account
resource "google_project_iam_member" "service_account_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/redis.editor"
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.propflow_services.email}"
}

# Secrets
resource "google_secret_manager_secret" "secrets" {
  for_each = toset([
    "jwt-secret",
    "stripe-secret-key",
    "stripe-publishable-key",
    "openai-api-key",
    "anthropic-api-key",
    "google-oauth-client-id",
    "google-oauth-client-secret",
    "twilio-account-sid",
    "twilio-auth-token",
    "db-password"
  ])

  secret_id = each.key

  replication {
    automatic = true
  }
}

# Secret versions (you'll need to update these with actual values)
resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.secrets["db-password"].id
  secret_data = random_password.db_password.result
}

# Cloud Run Services
resource "google_cloud_run_service" "propflow_services" {
  for_each = {
    "api-gateway" = {
      image = "gcr.io/${var.project_id}/propflow-api-gateway:latest"
      port  = 4000
      memory = "1Gi"
      cpu = "1000m"
      max_instances = 10
      allow_unauthenticated = true
    }
    "auth-service" = {
      image = "gcr.io/${var.project_id}/propflow-auth-service:latest"
      port  = 4001
      memory = "512Mi"
      cpu = "1000m"
      max_instances = 5
      allow_unauthenticated = false
    }
    "property-service" = {
      image = "gcr.io/${var.project_id}/propflow-property-service:latest"
      port  = 4002
      memory = "1Gi"
      cpu = "1000m"
      max_instances = 5
      allow_unauthenticated = false
    }
    "ai-services" = {
      image = "gcr.io/${var.project_id}/propflow-ai-services:latest"
      port  = 8000
      memory = "2Gi"
      cpu = "2000m"
      max_instances = 3
      allow_unauthenticated = false
    }
    "frontend" = {
      image = "gcr.io/${var.project_id}/propflow-frontend:latest"
      port  = 3000
      memory = "512Mi"
      cpu = "1000m"
      max_instances = 10
      allow_unauthenticated = true
    }
  }

  name     = "propflow-${each.key}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.propflow_services.email
      
      containers {
        image = each.value.image
        
        ports {
          container_port = each.value.port
        }

        resources {
          limits = {
            memory = each.value.memory
            cpu    = each.value.cpu
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name = "DATABASE_URL"
          value = "postgresql://${google_sql_user.propflow_user.name}:${random_password.db_password.result}@${google_sql_database_instance.propflow_db.private_ip_address}:5432/${each.key == "auth-service" ? "propflow_auth" : "propflow_main"}"
        }

        env {
          name  = "REDIS_URL"
          value = "redis://${google_redis_instance.propflow_redis.host}:${google_redis_instance.propflow_redis.port}"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = tostring(each.value.max_instances)
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.propflow_db.connection_name
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.propflow_connector.name
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.apis]
}

# VPC Access Connector for Cloud Run to access VPC resources
resource "google_vpc_access_connector" "propflow_connector" {
  name          = "propflow-connector"
  region        = var.region
  network       = google_compute_network.propflow_vpc.name
  ip_cidr_range = "10.1.0.0/28"
  
  depends_on = [google_project_service.apis]
}

# IAM for Cloud Run services
resource "google_cloud_run_service_iam_member" "public_access" {
  for_each = {
    for k, v in google_cloud_run_service.propflow_services : k => v
    if k == "api-gateway" || k == "frontend"
  }

  service  = each.value.name
  location = each.value.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "service_urls" {
  description = "URLs of the deployed Cloud Run services"
  value = {
    for k, v in google_cloud_run_service.propflow_services : k => v.status[0].url
  }
}

output "database_connection_name" {
  description = "Cloud SQL connection name"
  value = google_sql_database_instance.propflow_db.connection_name
}

output "redis_host" {
  description = "Redis host"
  value = google_redis_instance.propflow_redis.host
}

output "storage_bucket" {
  description = "Cloud Storage bucket name"
  value = google_storage_bucket.propflow_storage.name
}