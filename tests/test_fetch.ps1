$res = Invoke-WebRequest -Uri "https://evolution-moveallcrm-demo-tvijay.xqnsvk.easypanel.host/api/auth/login" -Method POST -Body (@{email="admin@movehome.com";password="admin123"} | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
$body = $res.Content | ConvertFrom-Json
$token = $body.data.token

try {
    $fetchRes = Invoke-WebRequest -Uri "https://evolution-moveallcrm-demo-tvijay.xqnsvk.easypanel.host/api/jobs" -Method GET -Headers @{Authorization="Bearer $token"} -UseBasicParsing
    Write-Host "Jobs fetched successfully!"
} catch [System.Net.WebException] {
    Write-Host "Failed!"
    if ($_.Exception.Response) {
        Write-Host "Status: $([int]$_.Exception.Response.StatusCode)"
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}
