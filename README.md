# 一、整體說明

本專案提供一組以 **大型語言模型（LLM）** 為核心的人生模擬遊戲 API。
遊戲透過多個 API，逐步生成玩家背景、人生事件、事件結果與最終評分，營造沉浸式的互動體驗。

系統於遊戲開始時建立一組 **session_id**，並將該局遊戲的基本狀態與隨機環境設定儲存於 **DynamoDB** 中。
後續所有 API 呼叫皆透過 `session_id` 識別同一局人生模擬流程。

### 遊戲頁面
<img width="1440" height="900" alt="%E6%88%AA%E5%9C%96%202026-01-08%20%E4%B8%8B%E5%8D%883 34 20拷貝" src="https://github.com/user-attachments/assets/d2b49f40-1d3b-4de0-bae6-4ce0d2f44bba" />

![life-report-95 (1)](https://github.com/user-attachments/assets/db4f3c9b-56ed-44ab-a236-365446012519)

---

# 二、API 文件

API 文件已移至 Lambda 目錄：`src/lambda/API.md`。

---

# 三、資料儲存設計（DynamoDB Schema）

資料庫 Schema 文件已移至 Lambda 目錄：`src/lambda/DATABASE_SCHEMA.md`。

---

# 四、共同前置步驟（兩種部署方式都需要）

## 1) 建立公開 S3

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

## 2) 上傳前端與 NPC

```bash
./scripts/deploy-frontend.sh <s3-bucket> <s3-prefix> [region]
./scripts/deploy-archive.sh <s3-bucket> <s3-prefix> [region]
```

# 五、開發版（SAM Local / SAM Deploy）

前置需求：已安裝 Docker 並啟動。

## 1) 安裝依賴與建置

```bash
sam build -t src/template/template.yaml
```

## 2) 啟動本機 API

```bash
sam local start-api -t src/template/template.yaml --env-vars ./src/template/env.json
```

如果遇到 Docker 拉不到映像檔，可以先拉基底映像：

```bash
docker pull public.ecr.aws/lambda/nodejs:18-arm64
```

---

# 六、CloudFormation 版（開發版）

前置需求：已設定 AWS CLI/認證與 SAM CLI。

## 1) 建置

```bash
sam build -t src/template/template.yaml
```

## 2) 上傳 Lambda

```bash
./scripts/package-lambda.sh <s3-bucket> <s3-key-prefix> [region]
```

## 3) 部署

```bash
sam deploy --guided
```

## 4) 取得 API URL

部署完成後，在 CloudFormation Outputs 取得 `ApiBaseUrl`，
或用以下指令查詢：

```bash
aws cloudformation describe-stacks \
  --stack-name bedrock-workshop-stack \
  --query "Stacks[0].Outputs"
```

# 七、呼叫 API（範例）

本機：使用 `http://127.0.0.1:3000`。部署：請改用 CloudFormation 輸出的 `ApiBaseUrl`。

```bash
curl -X POST http://127.0.0.1:3000/generate-background \
  -H "Content-Type: application/json" \
  -d '{"knowledge_base_id":"your-knowledge-base-id"}'
```

```bash
curl -X POST http://127.0.0.1:3000/generate-story \
  -H "Content-Type: application/json" \
  -d '{"session_id":"session_abc123"}'
```

```bash
curl -X POST http://127.0.0.1:3000/resolve-event \
  -H "Content-Type: application/json" \
  -d '{"session_id":"session_abc123","event":{},"selected_option":"A"}'
```

```bash
curl -X POST http://127.0.0.1:3000/generate-result \
  -H "Content-Type: application/json" \
  -d '{"session_id":"session_abc123"}'
```
