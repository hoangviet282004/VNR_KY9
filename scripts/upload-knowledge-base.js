// Chạy MỘT LẦN để upload giáo trình PDF lên Anthropic Files API.
// Sau khi chạy xong, copy "file_id" in ra vào biến môi trường ANTHROPIC_KB_FILE_ID
// (trong .env.local khi chạy local, và trong Vercel > Settings > Environment Variables khi deploy).
//
// Cách chạy:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/upload-knowledge-base.js

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.join(__dirname, "..", "data", "giao_trinh_dcs_vn.pdf");

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Thiếu ANTHROPIC_API_KEY. Chạy: ANTHROPIC_API_KEY=sk-ant-... node scripts/upload-knowledge-base.js");
    process.exit(1);
  }
  if (!fs.existsSync(PDF_PATH)) {
    console.error("Không tìm thấy file:", PDF_PATH);
    process.exit(1);
  }

  const client = new Anthropic();

  console.log("Đang upload:", PDF_PATH);
  const uploaded = await client.beta.files.upload({
    file: fs.createReadStream(PDF_PATH),
    betas: ["files-api-2025-04-14"],
  });

  console.log("\n✅ Upload thành công!");
  console.log("file_id:", uploaded.id);
  console.log("filename:", uploaded.filename);
  console.log("size_bytes:", uploaded.size_bytes);
  console.log("\n>>> Lưu giá trị file_id ở trên vào biến môi trường ANTHROPIC_KB_FILE_ID <<<");
}

main().catch((err) => {
  console.error("Lỗi upload:", err);
  process.exit(1);
});
