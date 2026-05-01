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