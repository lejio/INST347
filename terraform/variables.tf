variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "inst347-flashcards"
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "eastus2"
}

variable "cosmos_database_name" {
  description = "Name of the Cosmos DB database"
  type        = string
  default     = "flashcarddb"
}

variable "storage_container_name" {
  description = "Name of the blob storage container for file uploads"
  type        = string
  default     = "uploads"
}

variable "mssql_admin_user" {
  description = "Admin username for Azure SQL Server"
  type        = string
  default     = "sqladmin"
}

variable "mssql_admin_password" {
  description = "Admin password for Azure SQL Server"
  type        = string
  sensitive   = true
}

variable "mssql_database_name" {
  description = "Name of the SQL database for better-auth"
  type        = string
  default     = "authdb"
}

variable "local_dev_ip" {
  description = "Your local machine's public IP for SQL Server firewall rule"
  type        = string
  default     = "0.0.0.0"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    project     = "inst347-flashcards"
    environment = "dev"
  }
}
