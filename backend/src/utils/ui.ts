export const formatAIResponse = (aiText: string) => {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "🤖 VibeCheck AI Response" }
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: aiText }
    },
    { type: "divider" },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: "⚡ *Engine:* Llama 3.3 | *Latency:* Optimal | *Status:* Production" }
      ]
    }
  ];
};