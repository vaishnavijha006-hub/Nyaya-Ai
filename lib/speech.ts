"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface ErrorPayload {
  detail?: string;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.detail ?? `Voice request failed (${response.status}).`;
  } catch {
    return `Voice request failed (${response.status}).`;
  }
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio_file", audio, "recording.webm");

  const response = await fetch(`${API_URL}/speech-to-text`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(await getErrorMessage(response));

  const payload = (await response.json()) as { text: string };
  return payload.text;
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const response = await fetch(`${API_URL}/text-to-speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error(await getErrorMessage(response));

  return response.blob();
}
