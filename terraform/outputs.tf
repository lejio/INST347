# ---------- Outputs for .env.local ----------

output "mssql_server_fqdn" {
  description = "MSSQL_SERVER — Azure SQL Server fully qualified domain name"
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "mssql_database" {
  description = "MSSQL_DATABASE — SQL database name"
  value       = azurerm_mssql_database.auth.name
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
    BETTER_AUTH_SECRET=<run: openssl rand -hex 32>
    BETTER_AUTH_URL=http://localhost:3000
    MSSQL_SERVER=${azurerm_mssql_server.main.fully_qualified_domain_name}
    MSSQL_DATABASE=${azurerm_mssql_database.auth.name}
    MSSQL_USER=${var.mssql_admin_user}
    MSSQL_PASSWORD=<your-mssql-password>
    MSSQL_PORT=1433
    COSMOS_ENDPOINT=${azurerm_cosmosdb_account.main.endpoint}
    COSMOS_KEY=${azurerm_cosmosdb_account.main.primary_key}
    COSMOS_DATABASE=${azurerm_cosmosdb_sql_database.main.name}
    AZURE_STORAGE_CONNECTION_STRING=${azurerm_storage_account.main.primary_connection_string}
    AZURE_STORAGE_CONTAINER_NAME=${azurerm_storage_container.uploads.name}
    OPENAI_API_KEY=<your-openai-api-key>
  EOT
}
