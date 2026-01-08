# 工作坊部署指南（S3）

本文件提供工作坊使用者將 Lambda、前端與 NPC 資料上傳到 S3 的流程。

## 前置需求
- 已安裝 AWS CLI 並完成登入（或已設定 profile）
- 已安裝 Node.js / npm
- 已安裝 zip

## 1) 上傳 Lambda（zip）

```bash
./scripts/package-lambda.sh <s3-bucket> <s3-key-prefix> [region]
```

範例：
```bash
./scripts/package-lambda.sh bedrock-demo-213edq lambda us-east-1
```

輸出：
```
s3://bedrock-demo-213edq/lambda/lambda.zip
```

## 2) 上傳前端（build + zip）

```bash
./scripts/deploy-frontend.sh <s3-bucket> <s3-prefix> [region]
```

範例：
```bash
./scripts/deploy-frontend.sh bedrock-demo-213edq frontend us-east-1
```

輸出：
```
s3://bedrock-demo-213edq/frontend/frontend.zip
```

## 3) 上傳 NPC（zip）

```bash
./scripts/deploy-archive.sh <s3-bucket> <s3-prefix> [region]
```

範例：
```bash
./scripts/deploy-archive.sh bedrock-demo-213edq archive us-east-1
```

輸出：
```
s3://bedrock-demo-213edq/archive/npc.zip
```

## 常見問題
- 指定 AWS profile：在指令後加上 `--profile <profile>`，或先設定 `AWS_PROFILE=<profile>`
- region 預設為 `us-east-1`，可用參數覆蓋

## 公開 S3（讓他人可存取）

當你要讓他人透過網址讀取 S3 上的檔案（例如前端檔案或 zip），請檢查以下三點：

### 步驟 1：關閉「封鎖公開存取」

1. S3 Console -> 選擇你的 Bucket  
2. Permissions -> Block public access settings  
3. 關閉「Block all public access」並儲存

### 步驟 2：設定 Bucket Policy（允許公開讀取）

將 `<YOUR_BUCKET>` 改成你的 bucket 名稱：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<YOUR_BUCKET>/*"
    }
  ]
}
```

### 步驟 3：檢查加密方式

- SSE-S3（預設）可以公開讀取  
- SSE-KMS 會導致 AccessDenied（需要 `kms:Decrypt`）

若是 SSE-KMS，請重新上傳並改用 SSE-S3。
