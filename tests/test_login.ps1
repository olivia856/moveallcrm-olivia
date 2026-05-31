$res = Invoke-WebRequest -Uri "https://evolution-moveallcrm-demo-tvijay.xqnsvk.easypanel.host/api/auth/login" -Method POST -Body (@{email="admin@movehome.com";password="admin123"} | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
$body = $res.Content | ConvertFrom-Json
Write-Host "--- LOGIN RESPONSE ---"
$body | ConvertTo-Json -Depth 5
Write-Host "--- TOKEN EXTRACTION ---"
Write-Host "Token is: $($body.data.token)"
