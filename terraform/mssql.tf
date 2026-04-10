# ---------- Azure SQL Server (better-auth database) ----------

resource "azurerm_mssql_server" "main" {
  name                         = "sql-${var.project_name}-${random_string.suffix.result}"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = "canadacentral"
  version                      = "12.0"
  administrator_login          = var.mssql_admin_user
  administrator_login_password = var.mssql_admin_password
  minimum_tls_version          = "1.2"

  tags = var.tags
}

resource "azurerm_mssql_database" "auth" {
  name      = var.mssql_database_name
  server_id = azurerm_mssql_server.main.id
  sku_name  = "GP_S_Gen5_1"

  auto_pause_delay_in_minutes = 60
  min_capacity                = 0.5
  max_size_gb                 = 2

  tags = var.tags
}

# Allow Azure services to connect
resource "azurerm_mssql_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Allow local dev machine
resource "azurerm_mssql_firewall_rule" "local_dev" {
  name             = "AllowLocalDev"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = var.local_dev_ip
  end_ip_address   = var.local_dev_ip
}
