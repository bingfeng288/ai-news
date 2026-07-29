import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: subscribers, error: subError } = await supabase
      .from("profiles")
      .select("email, language")
      .eq("is_subscribed", true);

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ message: "No subscribers", sent: 0 });
    }

    const newsData = JSON.parse(
      readFileSync(join(process.cwd(), "data", "news.json"), "utf-8")
    );

    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.SITE_URL || "https://ai-news.vercel.app";
    const results = { sent: 0, failed: 0 };

    for (const subscriber of subscribers) {
      const lang = subscriber.language || "en";
      const html = renderEmailHtml(newsData, lang, siteUrl);
      const date = newsData.featured.date;

      try {
        await resend.emails.send({
          from: "AI News <onboarding@resend.dev>",
          to: subscriber.email,
          subject:
            lang === "zh"
              ? `AI 每日新闻 - ${date}`
              : `AI Daily News - ${date}`,
          html,
        });
        results.sent++;
      } catch (emailErr) {
        console.error(`Failed to send to ${subscriber.email}:`, emailErr);
        results.failed++;
      }
    }

    return res.status(200).json({ message: "Newsletter sent", ...results });
  } catch (error) {
    console.error("Newsletter error:", error);
    return res.status(500).json({ error: error.message });
  }
}

function renderEmailHtml(newsData, lang, siteUrl) {
  const articles = [newsData.featured, ...newsData.articles].slice(0, 6);
  const date = newsData.featured.date;

  const strings =
    lang === "zh"
      ? {
          title: "AI 每日新闻",
          subtitle: `${date} 精选`,
          readMore: "阅读更多",
          footer: "您收到此邮件是因为您订阅了 AI News 每日推送。",
          unsubscribe: "取消订阅",
        }
      : {
          title: "AI Daily News",
          subtitle: `${date} Highlights`,
          readMore: "Read More",
          footer:
            "You received this email because you subscribed to AI News daily digest.",
          unsubscribe: "Unsubscribe",
        };

  const articleRows = articles
    .map((a) => {
      const d = a[lang] || a.en;
      return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0 0 8px; font-size: 16px; color: #1a1a2e;">
            <a href="${siteUrl}/#/article/${a.id}" style="color: #6366f1; text-decoration: none;">
              ${d.title}
            </a>
          </h3>
          <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">
            ${d.excerpt}
          </p>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <tr><td style="text-align: center; padding: 24px 0;">
      <h1 style="font-size: 24px; color: #1a1a2e; margin: 0;">${strings.title}</h1>
      <p style="color: #666; margin: 8px 0 0;">${strings.subtitle}</p>
    </td></tr>
    <tr><td style="background: #fff; border-radius: 12px; padding: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${articleRows}
      </table>
    </td></tr>
    <tr><td style="text-align: center; padding: 24px 0; font-size: 12px; color: #999;">
      <p style="margin: 0 0 8px;">${strings.footer}</p>
      <a href="${siteUrl}" style="color: #6366f1;">${strings.unsubscribe}</a>
    </td></tr>
  </table>
</body>
</html>`;
}
