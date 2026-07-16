import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Bạn là trợ lý AI hỗ trợ học tập cho môn "Lịch sử Đảng Cộng sản Việt Nam", dựa trên nội dung Giáo trình Lịch sử Đảng Cộng sản Việt Nam (Bộ Giáo dục và Đào tạo, NXB Chính trị Quốc gia Sự thật, 2021) đính kèm trong tài liệu.

Quy tắc trả lời:
- Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng, bám sát nội dung giáo trình đính kèm.
- Khi trích số liệu, mốc thời gian, tên nghị quyết, tên đại hội... phải trích chính xác như trong giáo trình.
- Nếu câu hỏi nằm ngoài phạm vi giáo trình đính kèm, nói rõ là tài liệu không đề cập, không tự bịa thông tin.
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

  const fileId = process.env.ANTHROPIC_KB_FILE_ID;
  if (!process.env.ANTHROPIC_API_KEY || !fileId) {
    res.status(500).json({
      error: "Server chưa cấu hình ANTHROPIC_API_KEY / ANTHROPIC_KB_FILE_ID",
    });
    return;
  }

  try {
    const response = await client.beta.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      betas: ["files-api-2025-04-14"],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "file", file_id: fileId },
              cache_control: { type: "ephemeral" },
            },
            { type: "text", text: message.trim() },
          ],
        },
      ],
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
