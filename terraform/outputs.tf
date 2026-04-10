# ---------- Outputs for .env.local ----------

output "b2c_tenant_name" {
  description = "Azure AD B2C tenant name (domain prefix)"
  value       = var.b2c_domain_prefix
}

output "b2c_tenant_domain" {
  description = "Azure AD B2C full domain"
  value       = "${var.b2c_domain_prefix}.onmicrosoft.com"
}

output "b2c_tenant_id" {
  description = "Azure AD B2C tenant ID"
  value       = azurerm_aadb2c_directory.main.tenant_id
}

output "cosmos_endpoint" {
  description = "COSMOS_ENDPOINT — Cosmos DB account endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_key" {
  description = "COSMOS_KEY — Cosmos DB primary key"
  value       = azurerm_cosmosdb_account.main.primary_key
  sensitive   = true
}

output "cosmos_database" {
  description = "COSMOS_DATABASE — Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.main.name
}

output "azure_storage_connection_string" {
  description = "AZURE_STORAGE_CONNECTION_STRING — Storage account connection string"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

output "azure_storage_container_name" {
  description = "AZURE_STORAGE_CONTAINER_NAME — Blob container name"
  value       = azurerm_storage_container.uploads.name
}

# ---------- Helper: generate .env.local content ----------

output "env_local_template" {
  description = "Copy this into .env.local (run `terraform output -raw env_local_template`)"
  sensitive   = true
  value       = <<-EOT
    # Azure AD B2C — fill CLIENT_ID and CLIENT_SECRET from B2C portal app registration
    AZURE_AD_B2C_TENANT_NAME=${var.b2c_domain_prefix}
    AZURE_AD_B2C_CLIENT_ID=<from-b2c-portal-app-registration>
    AZURE_AD_B2C_CLIENT_SECRET=<from-b2c-portal-app-registration>
    AZURE_AD_B2C_PRIMARY_USER_FLOW=B2C_1_signupsignin
    AUTH_SECRET=<run: npx auth secret>
    COSMOS_ENDPOINT=${azurerm_cosmosdb_account.main.endpoint}
    COSMOS_KEY=${azurerm_cosmosdb_account.main.primary_key}
    COSMOS_DATABASE=${azurerm_cosmosdb_sql_database.main.name}
    AZURE_STORAGE_CONNECTION_STRING=${azurerm_storage_account.main.primary_connection_string}
    AZURE_STORAGE_CONTAINER_NAME=${azurerm_storage_container.uploads.name}
    OPENAI_API_KEY=<your-openai-api-key>
  EOT
}
