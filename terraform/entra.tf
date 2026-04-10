# ---------- Azure AD B2C Directory ----------
# Creates the B2C tenant. App registration and user flows
# must be configured manually in the Azure Portal (see outputs).

resource "azurerm_aadb2c_directory" "main" {
  country_code            = "US"
  data_residency_location = "United States"
  display_name            = "${var.project_name}-b2c"
  domain_name             = "${var.b2c_domain_prefix}.onmicrosoft.com"
  resource_group_name     = azurerm_resource_group.main.name
  sku_name                = "PremiumP1"

  tags = var.tags
}
