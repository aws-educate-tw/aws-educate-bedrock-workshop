# 一、整體說明

本專案提供一組以 **大型語言模型（LLM）** 為核心的人生模擬遊戲 API。
遊戲透過多個 API，逐步生成玩家背景、人生事件、事件結果與最終評分，營造沉浸式的互動體驗。

系統於遊戲開始時建立一組 **session_id**，並將該局遊戲的基本狀態與隨機環境設定儲存於 **DynamoDB** 中。
後續所有 API 呼叫皆透過 `session_id` 識別同一局人生模擬流程。

---

# 二、API 文件

API 文件已移至 Lambda 目錄：`src/lambda/API.md`。

---

# 三、資料儲存設計（DynamoDB Schema）

資料庫 Schema 文件已移至 Lambda 目錄：`src/lambda/DATABASE_SCHEMA.md`。

---

# 四、開發版（SAM Local / SAM Deploy）

前置需求：已安裝 Docker 並啟動。

## 1) 安裝依賴與建置

```bash
sam build -t src/template/template.yaml
```

## 2) 啟動本機 API

```bash
sam local start-api -t src/template/template.yaml --env-vars ./src/template/env.json
```

## 3) 呼叫 API（範例）

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

如果遇到 Docker 拉不到映像檔，可以先拉基底映像：

```bash
docker pull public.ecr.aws/lambda/nodejs:18-arm64
```

---

# 五、部署到 AWS（開發版）

前置需求：已設定 AWS CLI/認證與 SAM CLI。

## 1) 建置

```bash
sam build -t src/template/template.yaml
```

## 2) 部署

```bash
sam deploy --guided
```

## 3) 取得 API URL

部署完成後，在 CloudFormation Outputs 取得 `ApiBaseUrl`，
或用以下指令查詢：

```bash
aws cloudformation describe-stacks \
  --stack-name bedrock-workshop-stack \
  --query "Stacks[0].Outputs"
```

---

# 六、Workshop 版（ZIP + S3 + Infrastructure Composer）

Workshop 版會先把 Lambda 打包成 zip 上傳到 S3，並在模板裡直接指定 `CodeUri`，方便參加者匯入 Infrastructure Composer 直接建立自己的專案。
上傳與公開流程請見 `README.workshop-deploy.md`。

## 2) 更新模板中的 CodeUri

打包完成後，請更新 `archive/template.lambda-zip.yaml` 的 `CodeUri`：

```yaml
CodeUri: s3://workshop-demo-artifacts/lambda/lambda.zip
```

## 3) 部署（或匯入 Infrastructure Composer）

```bash
aws cloudformation deploy \
  --template-file archive/template.lambda-zip.yaml \
  --stack-name workshop-demo \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM
```

## 4) 上傳前端到 S3（打包成 zip）

請見 `README.workshop-deploy.md`。
