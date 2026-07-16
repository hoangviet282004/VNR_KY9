import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Nội dung thuyết trình — chỉ gồm phần bạn thực sự trình bày (Đại hội VIII, IX).
const CONTENT_PATH = path.join(
  __dirname,
  "..",
  "KhoNoiDung_3.2.2_DaiHoi_VIII_IX.md",
);
const PRESENTATION_CONTENT = fs.readFileSync(CONTENT_PATH, "utf-8");

const SYSTEM_PROMPT = `Bạn là trợ lý AI hỗ trợ học tập cho môn "Lịch sử Đảng Cộng sản Việt Nam", dựa trên nội dung dưới đây (trích từ phần thuyết trình về Đại hội VIII và Đại hội IX).

Nội dung tham khảo:
"""
${PRESENTATION_CONTENT}
"""

Quy tắc trả lời:
- Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng, bám sát nội dung tham khảo ở trên.
- Khi trích số liệu, mốc thời gian, tên nghị quyết, tên đại hội... phải trích chính xác như trong nội dung tham khảo.
- Nếu câu hỏi nằm ngoài phạm vi nội dung tham khảo, nói rõ là tài liệu không đề cập, không tự bịa thông tin.
- Nếu người dùng hỏi về nội dung không liên quan đến môn học, có thể trả lời ngắn gọn nhưng nhắc rằng bạn được thiết kế để hỗ trợ môn Lịch sử Đảng.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Thiếu trường 'message' (chuỗi câu hỏi)" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({
      error: "Server chưa cấu hình ANTHROPIC_API_KEY",
    });
    return;
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: message.trim() }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    res.status(200).json({
      reply: textBlock ? textBlock.text : "",
      usage: response.usage,
    });
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(500).json({
      error: "Lỗi khi gọi Claude API",
      detail: err?.message || String(err),
    });
  }
}
