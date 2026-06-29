export interface SmsConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  enabled: boolean;
}

export async function sendSms(config: SmsConfig, phone: string, message: string) {
  if (!config.enabled) return { error: "SMS not enabled" };

  // Ensure phone is in international format with + prefix
  let phoneClean = phone.replace(/[^0-9+]/g, "");
  if (phoneClean.startsWith("0")) {
    phoneClean = "+254" + phoneClean.slice(1);
  } else if (!phoneClean.startsWith("+")) {
    phoneClean = "+" + phoneClean;
  }

  const res = await fetch(`${config.baseUrl}/message`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumbers: [phoneClean],
      message: message,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `SMS API error ${res.status}`);
  }
  return data;
}
