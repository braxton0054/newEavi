export interface SmsConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  enabled: boolean;
}

export async function sendSms(config: SmsConfig, phone: string, message: string) {
  if (!config.enabled) return { error: "SMS not enabled" };

  const res = await fetch(`${config.baseUrl}/message`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipients: [{ recipients: [phone] }],
      message: [{ type: "auto", text: message }],
    }),
  });

  return res.json();
}
