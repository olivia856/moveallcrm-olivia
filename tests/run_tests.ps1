$baseUrl = "https://evolution-moveallcrm-demo-tvijay.xqnsvk.easypanel.host"
$global:adminToken = ""
$global:staffToken = ""

function Run-Test {
    param([string]$name, [scriptblock]$testBlock)
    Write-Host -NoNewline "Running: $name... "
    try {
        & $testBlock
        Write-Host -ForegroundColor Green "PASS"
    } catch {
        Write-Host -ForegroundColor Red "FAIL"
        Write-Host -ForegroundColor Red "  $($_.Exception.Message)"
    }
}

function Api-Call {
    param([string]$method, [string]$path, [hashtable]$body, [string]$token)
    
    $headers = @{}
    if (![string]::IsNullOrEmpty($token)) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    $params = @{
        Uri = "$baseUrl$path"
        Method = $method
        Headers = $headers
        UseBasicParsing = $true
    }
    
    if ($body -ne $null) {
        $params.Body = ($body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }
    
    try {
        $response = Invoke-WebRequest @params
        $bodyObj = $null
        if ($response.Content) {
            try { $bodyObj = $response.Content | ConvertFrom-Json } catch { }
        }
        return @{ Status = [int]$response.StatusCode; Body = $bodyObj }
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $response = $_.Exception.Response
            $statusCode = [int]$response.StatusCode
            return @{ Status = $statusCode; Body = $null }
        } else {
            return @{ Status = 500; Body = $null }
        }
    }
}

Write-Host "========================================="
Write-Host " Running MoveAll CRM Tests via PowerShell"
Write-Host "========================================="

# 1. Login
Run-Test "Admin can log in with correct credentials" {
    $res = Api-Call "POST" "/api/auth/login" @{email="admin@movehome.com";password="admin123"}
    if ($res.Status -ne 200) { throw "Expected 200, got $($res.Status)" }
    $global:adminToken = $res.Body.data.token
}

Run-Test "Staff can log in with correct credentials" {
    $res = Api-Call "POST" "/api/auth/login" @{email="tvijaytamil1999@gmail.com";password="1234"}
    if ($res.Status -ne 200) { throw "Expected 200, got $($res.Status)" }
    $global:staffToken = $res.Body.data.token
}

Run-Test "Login fails with wrong password" {
    $res = Api-Call "POST" "/api/auth/login" @{email="admin@movehome.com";password="wrongpassword"}
    if ($res.Status -ne 401) { throw "Expected 401, got $($res.Status)" }
}

# 2. Auth Guard
Run-Test "Cannot access leads without token" {
    $res = Api-Call "GET" "/api/leads" $null $null
    if ($res.Status -notin 401, 403) { throw "Expected 401/403, got $($res.Status)" }
}

# 3. Leads
Run-Test "Admin can fetch all leads" {
    $res = Api-Call "GET" "/api/leads" $null $global:adminToken
    if ($res.Status -ne 200) { throw "Expected 200, got $($res.Status)" }
}

Run-Test "Admin can create a new lead" {
    $res = Api-Call "POST" "/api/leads" @{
        lead_name="Test Lead Auto";phone="0412345678";email="testlead@auto.com";
        move_date="2026-08-01";move_out_address="1 Test St";move_in_address="2 Test Ave";
        status="New to call";category="Local Move";lead_source="Manually Added"
    } $global:adminToken
    if ($res.Status -notin 200, 201) { throw "Expected 200/201, got $($res.Status)" }
}

# 4. Jobs
Run-Test "Admin can fetch all jobs" {
    $res = Api-Call "GET" "/api/jobs" $null $global:adminToken
    if ($res.Status -ne 200) { throw "Expected 200, got $($res.Status)" }
}

# 5. Role permissions
Run-Test "Staff cannot access users list" {
    $res = Api-Call "GET" "/api/users" $null $global:staffToken
    if ($res.Status -notin 401, 403) { throw "Expected 401/403, got $($res.Status)" }
}

Run-Test "Admin can access users list" {
    $res = Api-Call "GET" "/api/users" $null $global:adminToken
    if ($res.Status -ne 200) { throw "Expected 200, got $($res.Status)" }
}

# 6. Contacts
Run-Test "Admin can fetch contacts" {
    $res = Api-Call "GET" "/api/contacts" $null $global:adminToken
    if ($res.Status -ne 200) { throw "Expected 200, got $($res.Status)" }
}

Write-Host "========================================="
Write-Host " Tests completed."
