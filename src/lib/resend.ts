export async function enviarEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM_EMAIL ?? "Approva <onboarding@resend.dev>";

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!resposta.ok) {
      console.error("Falha ao enviar e-mail via Resend:", await resposta.text());
    }
  } catch (erro) {
    console.error("Erro ao chamar a API do Resend:", erro);
  }
}
