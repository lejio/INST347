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

variable "b2c_domain_prefix" {
  description = "Azure AD B2C tenant domain prefix (becomes <prefix>.onmicrosoft.com)"
  type        = string
  default     = "inst347flashcards"
}

variable "app_homepage_url" {
  description = "Homepage URL of the Next.js app"
  type        = string
  default     = "http://localhost:3000"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    project     = "inst347-flashcards"
    environment = "dev"
  }
}
